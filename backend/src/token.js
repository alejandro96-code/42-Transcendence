import jwt from 'jsonwebtoken';
import express, { response } from 'express';
import { formatErrorJson, isAuthenticated, verifyPassword } from './utils.js';
import { pool } from "./db.js";

const router = express.Router();

async function get_token(req, res) {
    const username = req.body?.username.trim();
    const password = String(req.body?.password ?? '');

    if (!username || !password) {
        return res.status(400).json(formatErrorJson(400, "Bad Request", "Username and password can't be blank"));
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    const user = result.rows[0];

    const user_rows = await pool.query(
        'SELECT id, user_role, password_hash FROM users WHERE username = $1',
        [username]
    );

    if (!user_rows || user_rows.rows.length == 0 || !verifyPassword(password, user_rows.rows[0].password_hash)) {
        res.status(404).json(formatErrorJson(404, "Not Found", "User not found in database"));
        return;
    }

    const jwt_secret = process.env.JWT_SECRET;
    const token_expiry = process.env.TOKEN_EXPIRY || "2";

    const token_data = {
        userId: user_rows.rows[0].id,
        admin: user_rows.rows[0].user_role == "admin" ? true : false,
    }

    console.log(token_data)

    res.status(200).json({"token": jwt.sign(token_data, jwt_secret, {expiresIn: token_expiry + "h"})});
}

export function verify_token(req, res) {
    const token = req.header["Authentication"] &&
    req.header["Authentication"].split(" ").length == 2 &&
    req.header["Authentication"].split(" ")[0] == "Bearer" ?
    req.header["Authentication"].split(" ")[1] : ""
    const jwt_secret = process.env.JWT_SECRET;

    if (!token) {
        res.status(400).json(formatErrorJson(400, "Bad Request", "Bad token header format"));
    }

    if (jwt.verify(token, jwtSecretKey)) {
        return next();
    }
    res.status(401).json(formatErrorJson(401, "Unauthorized", "Bad token"));
}

router.post("/", get_token);

export default router;