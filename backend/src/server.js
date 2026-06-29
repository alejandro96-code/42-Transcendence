import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import session from 'express-session';
import passport from 'passport';
import { Strategy as FortyTwoStrategy } from 'passport-42';
import posts_endpoints from "./posts.js"
import { isAuthenticated } from "./utils.js"

function start_server() {
    dotenv.config();
    const app = express();
    const PORT = process.env.PORT || 4000;

    // Middleware
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }));
    app.use(express.json());

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
        res.json(req.user);
    });

    app.post('/api/auth/logout', (req, res) => {
        req.logout((err) => {
            if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
            }
            res.json({ message: 'Sesión cerrada' });
        });
    });

    // Rutas de ejemplo
    app.get('/', (req, res) => {
        res.json({ message: 'API de Transcendence funcionando!' });
    });

    app.get('/api/users', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM users');
            res.json(result.rows);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    });

    app.get('/api/health', async (req, res) => {
        try {
            await pool.query('SELECT 1');
            res.json({ status: 'ok', database: 'connected' });
        } catch (error) {
            res.status(500).json({ status: 'error', database: 'disconnected' });
        }
    });

    posts_endpoints(app, pool);

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

export default start_server