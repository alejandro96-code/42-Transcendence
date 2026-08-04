import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import session from 'express-session';
import passport from 'passport';
import { Strategy as FortyTwoStrategy } from 'passport-42';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ValidationError } from "express-json-validator-middleware";
import posts_endpoints from "./posts.js"
import chat_endpoints from "./chat.js"
import friends_endpoints from "./friends.js"
import { isAuthenticated } from "./utils.js"

const MIN_PASSWORD_LENGTH = 6;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeUsername(value) {
    return String(value ?? '').trim();
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
    if (!passwordHash || !passwordHash.includes(':')) {
        return false;
    }

    try {
        const [salt, hash] = passwordHash.split(':');
        const storedBuffer = Buffer.from(hash, 'hex');
        const computedBuffer = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');

        if (storedBuffer.length !== computedBuffer.length) {
            return false;
        }

        return timingSafeEqual(storedBuffer, computedBuffer);
    } catch {
        return false;
    }
}

function toPublicUser(user) {
    if (!user) {
        return null;
    }

    const { password_hash, ...rest } = user;
    return {
        ...rest,
        intra_id: rest.intra_id ?? null,
        email: rest.email ?? '',
        full_name: rest.full_name ?? rest.username ?? '',
        avatar_url: rest.avatar_url ?? '',
    };
}

async function ensureAuthSchema(pool) {
    await pool.query(`
        ALTER TABLE users
        ALTER COLUMN intra_id DROP NOT NULL
    `);
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content VARCHAR(1000) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT messages_different_users CHECK (sender_id <> recipient_id)
        )
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS messages_conversation_idx
        ON messages (sender_id, recipient_id, created_at)
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS friend_requests (
            id SERIAL PRIMARY KEY,
            requester_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT friend_requests_different_users CHECK (requester_id <> recipient_id),
            CONSTRAINT friend_requests_unique_pair UNIQUE (requester_id, recipient_id)
        )
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS friend_requests_recipient_idx
        ON friend_requests (recipient_id, status, created_at DESC)
    `);
}

function start_server() {
    dotenv.config();
    const app = express();
    const PORT = process.env.PORT || 4000;

    console.log("Server start")
    
    // Middleware
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }));
    app.use(express.json());

    // JSONSCHEMA ERROR HANDLER
    app.use((error, request, response, next) => {
        if (error instanceof ValidationError) {
            response.status(400).json(formatErrorJson(400, "Bad request",
                error.name + " " + error.validationErrors));
            return;
        }

        next(error);
    });


    // Configuración de sesión
    app.use(session({
        secret: process.env.SESSION_SECRET || 'secret-key-change-this',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        }
    }));

    // Inicializar Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Configuración de PostgreSQL
    const pool = new pg.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'transcendence',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    // Configuración de Passport con 42
    passport.use(new FortyTwoStrategy({
        clientID: process.env.FORTYTWO_CLIENT_ID,
        clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
        callbackURL: process.env.FORTYTWO_CALLBACK_URL
    },

    async (accessToken, refreshToken, profile, done) => {
        try {
            // Obtener el avatar de la API de 42
            const avatarUrl = profile._json?.image?.link || 
                            profile._json?.image_url || 
                            profile.photos?.[0]?.value || 
                            '';

            // Buscar o crear usuario en la base de datos
            const result = await pool.query(
                'SELECT * FROM users WHERE intra_id = $1',
                [profile.id]
            );

            let user;
            if (result.rows.length === 0) {
            // Crear nuevo usuario
            const insertResult = await pool.query(
                `INSERT INTO users (intra_id, username, email, full_name, avatar_url) 
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [
                    profile.id,
                    profile.username,
                    profile.emails?.[0]?.value || '',
                    profile.displayName || profile.username,
                    avatarUrl
                ]
            );
            user = insertResult.rows[0];
            } else {
            // Actualizar avatar si cambió
            const updateResult = await pool.query(
                `UPDATE users SET avatar_url = $1, full_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $4 RETURNING *`,
                [avatarUrl, profile.displayName || profile.username, profile.emails?.[0]?.value || '', result.rows[0].id]
            );
            user = updateResult.rows[0];
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

    // Serialización de usuario para la sesión
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            done(null, result.rows[0]);
        } catch (error) {
            done(error, null);
        }
    });

    // Rutas de autenticación
    app.get('/api/auth/42', passport.authenticate('42'));

    app.get('/api/auth/42/callback',
        passport.authenticate('42', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
        (req, res) => {
            // Autenticación exitosa, redirigir al frontend
            res.redirect(`${process.env.FRONTEND_URL}/callback?success=true`);
        }
    );

    app.get('/api/auth/me', isAuthenticated, (req, res) => {
        res.json(toPublicUser(req.user));
    });

    app.post('/api/auth/register', async (req, res) => {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password ?? '');
        const fullName = normalizeText(req.body?.fullName);
        const email = normalizeText(req.body?.email).toLowerCase();

        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({ error: 'El usuario debe tener entre 3 y 30 caracteres (letras, números, . _ -).' });
        }
        if (!fullName || fullName.length > 100) {
            return res.status(400).json({ error: 'El nombre completo es obligatorio y debe tener máximo 100 caracteres.' });
        }
        if (!EMAIL_REGEX.test(email) || email.length > 100) {
            return res.status(400).json({ error: 'Debes indicar un correo electrónico válido.' });
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
        }

        try {
            const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
            if (existingUser.rows.length > 0) {
                return res.status(409).json({ error: 'Ese nombre de usuario ya existe.' });
            }
            const existingEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            if (existingEmail.rows.length > 0) {
                return res.status(409).json({ error: 'Ese correo electrónico ya está en uso.' });
            }

            const passwordHash = hashPassword(password);
            const avatarInitials = username.slice(0, 2).toUpperCase() || 'US';
            const avatarUrl = `https://via.placeholder.com/96?text=${encodeURIComponent(avatarInitials)}`;

            const result = await pool.query(
                `INSERT INTO users (intra_id, username, email, full_name, avatar_url, password_hash)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [null, username, email, fullName, avatarUrl, passwordHash]
            );

            const user = result.rows[0];
            req.login(user, (error) => {
                if (error) {
                    return res.status(500).json({ error: 'No se pudo iniciar sesión tras el registro.' });
                }
                return res.status(201).json(toPublicUser(user));
            });
        } catch (error) {
            console.error('Error en registro local:', error);
            return res.status(500).json({ error: 'Error al registrar usuario' });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password ?? '');

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
        }

        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
            const user = result.rows[0];

            if (!user || !verifyPassword(password, user.password_hash)) {
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            req.login(user, (error) => {
                if (error) {
                    return res.status(500).json({ error: 'Error al iniciar sesión' });
                }
                return res.json(toPublicUser(user));
            });
        } catch (error) {
            console.error('Error en login local:', error);
            return res.status(500).json({ error: 'Error al iniciar sesión' });
        }
    });

    app.post('/api/auth/logout', (req, res) => {
        req.logout((err) => {
            if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
            }
            res.json({ message: 'Sesión cerrada' });
        });
    });

    app.get('/', (req, res) => {
        res.json({ message: 'API de Transcendence funcionando!' });
    });

    app.get('/api/users', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM users');
            res.json(result.rows.map(toPublicUser));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    });

    app.get('/api/health', async (req, res) => {
        console.log("After all this time, it's still you")

        try {
            await pool.query('SELECT 1');
            res.json({ status: 'ok', database: 'connected' });
        } catch (error) {
            res.status(500).json({ status: 'error', database: 'disconnected' });
        }
    });

    app.use("/api/posts", posts_endpoints);
    app.use("/api/messages", chat_endpoints);
    app.use("/api/friends", friends_endpoints);

    ensureAuthSchema(pool)
        .then(() => {
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`Servidor corriendo en http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error('Error preparando el esquema de autenticación:', error);
            process.exit(1);
        });
}

export default start_server
