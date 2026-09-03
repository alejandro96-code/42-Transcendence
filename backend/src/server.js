import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import session from 'express-session';
import passport from 'passport';
import { Strategy as FortyTwoStrategy } from 'passport-42';
import { ValidationError } from "express-json-validator-middleware";
import posts_endpoints from "./posts.js"
import chat_endpoints from "./chat.js"
import friends_endpoints from "./friends.js"
import token_endpoints from "./token.js"
import { isAuthenticated, formatErrorJson, hashPassword, verifyPassword } from "./utils.js"
import { verify_token } from "./token.js";
import notifications_endpoints from "./notificationsRoutes.js";

const MIN_PASSWORD_LENGTH = 6;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_PROFESSION_MAX_LENGTH = 80;
const PROFILE_DESCRIPTION_MAX_LENGTH = 200;

function createRateLimiter({ windowMs, max, name }) {
    const requests = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const entry = requests.get(key);

        if (!entry || entry.resetAt <= now) {
            requests.set(key, { count: 1, resetAt: now + windowMs });
            res.set('X-RateLimit-Limit', String(max));
            return next();
        }

        entry.count += 1;
        res.set('X-RateLimit-Limit', String(max));
        res.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));

        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json(formatErrorJson(
                429,
                'Too Many Requests',
                `${name} rate limit exceeded. Retry in ${retryAfter} seconds`
            ));
        }

        return next();
    };
}

function normalizeUsername(value) {
    return String(value ?? '').trim();
}

function normalizeText(value) {
    return String(value ?? '').trim();
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
        avatar_url: rest.avatar_url || '/img/Not_image.png',
        profession: rest.profession ?? '',
        description: rest.description ?? '',
    };
}

async function migrateLegacyAvatars(pool, avatarDirectory) {
    const legacyUsers = await pool.query(
        "SELECT id, avatar_url FROM users WHERE avatar_url LIKE 'data:image/%'"
    );
    if (legacyUsers.rows.length === 0) return;

    await mkdir(avatarDirectory, { recursive: true });
    const imagePattern = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/i;
    for (const user of legacyUsers.rows) {
        const match = user.avatar_url.match(imagePattern);
        if (!match) continue;

        const extension = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
        const imageBuffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
        if (imageBuffer.length === 0 || imageBuffer.length > 2 * 1024 * 1024) continue;

        const filename = `${randomUUID()}.${extension}`;
        await writeFile(path.join(avatarDirectory, filename), imageBuffer, { flag: 'wx' });
        await pool.query(
            'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [`/api/uploads/avatars/${filename}`, user.id]
        );
    }
}

async function start_server() {
    dotenv.config();
    const app = express();
    const avatarDirectory = path.resolve('backend/uploads/avatars');
    const PORT = process.env.PORT || 4000;
    const SERVER_IP = process.env.SERVER_IP;
    const FRONTEND_URL = process.env.FRONTEND_URL || `http://${SERVER_IP}:3000`;
    const BACKEND_URL = process.env.BACKEND_URL || `http://${SERVER_IP}:${PORT}`;
    const FORTYTWO_CALLBACK_URL = process.env.FORTYTWO_CALLBACK_URL || `${BACKEND_URL}/api/auth/42/callback`;
        const sessionSecret = process.env.SESSION_SECRET;
        console.log("Server start")

    const allowedOrigins = [
        `https://${SERVER_IP}:8443`,
    ].filter(Boolean);

    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS Not allowed'));
            }
        },
        credentials: true
    }));

    app.use(express.json({ limit: '5mb' }));
    app.use('/api/uploads/avatars', express.static(avatarDirectory, {
        index: false,
        fallthrough: false
    }));

    app.use((error, request, response, next) => {
        if (error instanceof ValidationError) {
            response.status(400).json(formatErrorJson(400, "Bad Request",
                error.name + " " + error.validationErrors));
            return;
        }

        next(error);
    });

    if (!sessionSecret) {
        throw new Error('SESSION_SECRET not in env');
    }

    app.set('trust proxy', 1);
    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    const apiRateLimit = createRateLimiter({
        windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
        name: 'API'
    });
    const authRateLimit = createRateLimiter({
        windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
        name: 'Authentication'
    });
    app.use('/api', apiRateLimit);
    app.use(['/api/auth/register', '/api/auth/login', '/api/token'], authRateLimit);

    const pool = new pg.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'transcendence',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });
    await migrateLegacyAvatars(pool, avatarDirectory);

    passport.use(new FortyTwoStrategy({
        clientID: process.env.FORTYTWO_CLIENT_ID,
        clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
        callbackURL: FORTYTWO_CALLBACK_URL
    },

        async (accessToken, refreshToken, profile, done) => {
            try {

                const avatarUrl = profile._json?.image?.link ||
                    profile._json?.image_url ||
                    profile.photos?.[0]?.value ||
                    '/img/Not_image.png';

                const intraUsername = `${profile.username}_42`;
                const result = await pool.query(
                    'SELECT * FROM users WHERE intra_id = $1',
                    [profile.id]
                );

                let user;
                if (result.rows.length === 0) {

                    console.log(`Registering new intra user: ${intraUsername}`);
                    const insertResult = await pool.query(
                        `INSERT INTO users (intra_id, username, email, full_name, avatar_url, profession, description, is_intra_user) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                        [
                            profile.id,
                            intraUsername,
                            profile.emails?.[0]?.value || '',
                            profile.displayName || profile.username,
                            avatarUrl,
                            null,
                            null,
                            true
                        ]
                    );
                    user = insertResult.rows[0];
                } else {
                    console.log(`Intra user ${intraUsername} found, updating`);
                    const updateResult = await pool.query(
                        `UPDATE users 
                    SET avatar_url = $1, full_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP, is_intra_user = $4
                    WHERE id = $5 RETURNING *`,
                        [
                            avatarUrl,
                            profile.displayName || profile.username,
                            profile.emails?.[0]?.value || '',
                            true,
                            result.rows[0].id
                        ]
                    );
                    user = updateResult.rows[0];
                }

                return done(null, user);
            } catch (error) {
                console.error("Error on 42 Passport strategy", error);
                return done(error, null);
            }
        }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

            if (!res || !res.rows || res.rows.length === 0) {
                const error = new Error('Account does not exist');
                error.statusCode = 404;
                return done(error, null);
            }

            const user = res.rows[0];
            done(null, user);
        } catch (error) {
            console.error("Internal sever error on deserializeUser");
            done(error, null);
        }
    });

    app.get('/api/auth/42', passport.authenticate('42'));

    app.get('/api/auth/42/callback',
        passport.authenticate('42', {
            failureRedirect: `${FRONTEND_URL}/`,
        }),
        (req, res) => {
            res.redirect(`${FRONTEND_URL}/profile`);
        }
    );

    app.post('/api/auth/avatar', isAuthenticated, async (req, res) => {
        const avatarUrl = req.body?.image;

        if (!avatarUrl || typeof avatarUrl !== 'string') {
            return res.status(400).json(
                formatErrorJson(
                    400,
                    "Bad Request",
                    "No avatar image provided"
                )
            );
        }

        const match = avatarUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
        if (!match) {
            return res.status(400).json(
                formatErrorJson(
                    400,
                    "Bad Request",
                    "Invalid avatar image"
                )
            );
        }

        try {
            const extension = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
            const imageBuffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
            const maxAvatarBytes = 2 * 1024 * 1024;

            if (imageBuffer.length === 0 || imageBuffer.length > maxAvatarBytes) {
                return res.status(413).json(
                    formatErrorJson(413, "Content Too Large", "Avatar must be smaller than 2 MB")
                );
            }

            await mkdir(avatarDirectory, { recursive: true });
            const filename = `${randomUUID()}.${extension}`;
            await writeFile(path.join(avatarDirectory, filename), imageBuffer, { flag: 'wx' });
            const storedAvatarUrl = `/api/uploads/avatars/${filename}`;

            const result = await pool.query(
                `UPDATE users
                SET avatar_url = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *`,
                [
                    storedAvatarUrl,
                    req.user.id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json(
                    formatErrorJson(
                        404,
                        "Not Found",
                        "User not found"
                    )
                );
            }

            return res.json(toPublicUser(result.rows[0]));
        } catch (error) {
            console.error('Error uploading avatar:', error);

            return res.status(500).json(
                formatErrorJson(
                    500,
                    "Internal server error",
                    `Error on avatar upload: ${error}`
                )
            );
        }
    });

    app.get('/api/auth/me', (req, res) => {
        if (!req.user) {
            return res.status(200).json(null)
        }

        return res.json(toPublicUser(req.user))
    })

    app.post('/api/auth/register', async (req, res) => {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password ?? '');
        const fullName = normalizeText(req.body?.fullName);
        const email = normalizeText(req.body?.email).toLowerCase();
        
        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", 'Usernames must be between 3 and 30 characters long (allowed characters: letters, numbers, ".", "_" and "-")'));
        }
        if (!fullName || fullName.length > 100) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", 'Full name is mandatory and must be at most 100 characters long'));
        }
        if (!EMAIL_REGEX.test(email) || email.length > 100) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", 'Invalid email'));
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", `Password must be at least ${MIN_PASSWORD_LENGTH} long`));
        }

        try {
            const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
            if (existingUser.rows.length > 0) {
                return res.status(409).json(formatErrorJson(409, "Conflict", 'Username already taken'));
            }
            const existingEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            if (existingEmail.rows.length > 0) {
                return res.status(409).json(formatErrorJson(409, "Conflict", 'Email already associated to an account'));
            }

            const passwordHash = hashPassword(password);
            const avatarUrl = '/img/Not_image.png';
            const result = await pool.query(
                `INSERT INTO users (intra_id, username, email, full_name, avatar_url, profession, description, password_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [null, username, email, fullName, avatarUrl, null, null, passwordHash]
            );

            const user = result.rows[0];
            req.login(user, (error) => {
                if (error) {
                    return res.status(500).json(formatErrorJson(500, "Internal server error", `Error on login: ${error}`));
                }
                return res.status(201).json(toPublicUser(user));
            });
        } catch (error) {
            return res.status(500).json(formatErrorJson(500, "Internal server error", `Error on login: ${error}`));
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password ?? '');

        if (!username || !password) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", "Username and password can't be blank"));
        }

        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
            const user = result.rows[0];

            if (!user || !verifyPassword(password, user.password_hash)) {
                return res.status(401).json(formatErrorJson(401, "Unauthorized", "Wrong password or username"));
            }

            req.login(user, (error) => {
                if (error) {
                    return res.status(500).json(formatErrorJson(500, "Internal server error", `Error on login: ${error}`));
                }
                return res.json(toPublicUser(user));
            });
        } catch (error) {
            return res.status(500).json(formatErrorJson(500, "Internal server error", `Error on login: ${error}`));
        }
    });

    app.post('/api/auth/logout', (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json(formatErrorJson(500, "Internal server error", `Error on logout: ${err}`));
            }
            req.session.destroy((sessionError) => {
                if (sessionError) {
                    return res.status(500).json(formatErrorJson(500, "Internal server error", `Error destroying session: ${sessionError}`));
                }
                res.clearCookie('connect.sid');
                return res.status(204).end();
            });
        });
    });

app.patch('/api/auth/me', isAuthenticated, async (req, res) => {
    const profession = normalizeText(req.body?.profession);
    const description = normalizeText(req.body?.description);

    if (profession.length > PROFILE_PROFESSION_MAX_LENGTH) {
        return res.status(400).json(
            formatErrorJson(
                400,
                "Bad Request",
                `Profession must be less than ${PROFILE_PROFESSION_MAX_LENGTH} characters long`
            )
        );
    }

    if (description.length > PROFILE_DESCRIPTION_MAX_LENGTH) {
        return res.status(400).json(
            formatErrorJson(
                400,
                "Bad Request",
                `Description must be less than ${PROFILE_DESCRIPTION_MAX_LENGTH} characters long`
            )
        );
    }

    try {
        const result = await pool.query(
            `UPDATE users
             SET profession = $1,
                 description = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [
                profession || null,
                description || null,
                req.user.id
            ]
        );

        return res.json(toPublicUser(result.rows[0]));
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal server error",
                `Error on updating user: ${error}`
            )
        );
    }
});

    app.get('/', (req, res) => {
        res.json({ message: 'Transcendence API working!' });
    });

    app.get('/api/users', verify_token, async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM users');
            res.json(result.rows.map(toPublicUser));
        } catch (error) {
            console.error(`Error on user retrieval: ${error}`);
            res.status(500).json(formatErrorJson(500, "Internal server error", `Error on user retrieval: ${error}`));
        }
    });

    app.get('/api/health', async (req, res) => {
        try {
            await pool.query('SELECT 1');
            res.json({ status: 'ok', database: 'connected' });
        } catch (error) {
            res.status(500).json(formatErrorJson(500, "Internal server error", `Database disconnected`));
        }
    });

    app.use("/api/posts", posts_endpoints);
    app.use("/api/messages", chat_endpoints);
    app.use("/api/friends", friends_endpoints);
    app.use("/api/token", token_endpoints);
    app.use("/api/notifications", notifications_endpoints);

    try {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Backend running on ${BACKEND_URL}`);
        });

    } catch(error) {
        console.error('Error:', error);
        process.exit(1);
    };
}

export default start_server
