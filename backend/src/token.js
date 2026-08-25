import jwt from 'jsonwebtoken';
import express, { response } from 'express';
import { formatErrorJson, isAuthenticated } from './utils.js';
import { pool } from "./db.js";

const router = express.Router();

async function get_token(req, res) {
    const jwt_secret = process.env.JWT_SECRET;
    const user_rows = await pool.query(
        'SELECT id, user_role FROM users WHERE id = $1',
        [req.user]
    );

    if (!user_rows || user_rows.rows.length == 0) {
        res.status(404).json(formatErrorJson(404, "Not Found", "User not found in database"));
        return;
    }
    
    const token_expiry = process.env.TOKEN_EXPIRY || "2";

    const token_data = {
        userId: user_rows[0].id,
        admin: user_rows[0].user_role == "admin" ? true : false,
        expiresIn: token_expiry
    }

    return (jwt.sign(token_data, jwt_secret));
}

export function verify_token(req, res) {
    const token = req.header["Authentication"] &&
    req.header["Authentication"].split(" ").length == 2 &&
    req.header["Authentication"].split(" ")[0] == "Bearer" ?
    req.header["Authentication"].split(" ")[1] : ""
    const jwt_secret = process.env.JWT_SECRET;

    if (!token) {
        res.status(400).json(formatErrorJson(400, "Bad Request", "Bad token headerformat"));
    }

    if (jwt.verify(token, jwtSecretKey)) {
        return next();
    }
    res.status(401).json(formatErrorJson(401, "Unauthorized", "Bad token"));
}

router.post("/", isAuthenticated, get_token);

export default router;