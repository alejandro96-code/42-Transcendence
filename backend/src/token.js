import jwt from 'jsonwebtoken';
import express, { response } from 'express';
import { formatErrorJson, isAuthenticated, verifyPassword } from './utils.js';
import { pool } from "./db.js";

const router = express.Router();

async function get_token(req, res) {
    const username = req.body?.username?.trim();
    const password = String(req.body?.password ?? '');

    if (!username || !password) {
        return res.status(400).json(formatErrorJson(400, "Bad Request", "Username and password can't be blank", "AUTH_CREDENTIALS_MISSING"));
    }

    const jwt_secret = process.env.JWT_SECRET;

    if (!jwt_secret) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json(formatErrorJson(500, "Internal server error", "Token issuing is not configured", "SERVER_ERROR"));
    }

    try {
        const user_rows = await pool.query(
            'SELECT id, user_role, password_hash FROM users WHERE username = $1',
            [username]
        );

        if (!user_rows || user_rows.rows.length == 0 || !verifyPassword(password, user_rows.rows[0].password_hash)) {
            return res.status(404).json(formatErrorJson(404, "Not Found", "User not found in database", "AUTH_USER_NOT_FOUND"));
        }

        const token_expiry = process.env.TOKEN_EXPIRY || "2";

        const token_data = {
            userId: user_rows.rows[0].id,
            admin: user_rows.rows[0].user_role == "admin" ? true : false,
        }

        return res.status(200).json({"token": jwt.sign(token_data, jwt_secret, {expiresIn: token_expiry + "h"})});
    } catch (error) {
        console.error('Error issuing token:', error);
        return res.status(500).json(formatErrorJson(500, "Internal server error", "Error issuing token", "SERVER_ERROR"));
    }
}

export function verify_token(req, res, next) {
    const auth_header = req.headers["authorization"];
    const auth_parts = typeof auth_header === "string" ? auth_header.trim().split(/\s+/) : [];
    const token = auth_parts.length === 2 && auth_parts[0] === "Bearer"
        ? auth_parts[1].trim()
        : "";
    const jwt_secret = process.env.JWT_SECRET;
    
    if (!token) {
        if (req.isAuthenticated()) {
            return next();
        }

        res.status(401).json(formatErrorJson(401, "Unauthorized", "Authentication required", "AUTH_REQUIRED"));
        return;
    }

    try {
        res.locals.decoded_token = jwt.verify(token, jwt_secret);
        req.user = {"id": res.locals.decoded_token.userId};
        return next();
    } catch {
        res.status(401).json(formatErrorJson(401, "Unauthorized", "Bad token", "AUTH_TOKEN_INVALID"));
    }
}

router.use(express.json())

router.post("/", get_token);

export default router;