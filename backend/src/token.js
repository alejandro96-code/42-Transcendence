import jwt from jsonwebtoken;
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { formatErrorJson, verifyPassword } from './utils';
import { pool } from "./db.js";

const router = express.Router();

function refresh(req, res) {
    const authHeader = req.headers["authorization"]
    if (!authHeader.split(" ")[0] || authHeader.split(" ")[0] != "Bearer") {
        res.status(400).json(formatErrorJson(400, "Bad Request", "Authorization header needed and need to be Bearer type"));
        return;
    }

    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(400).json(formatErrorJson(400, "Bad Request", "Token invalid"));
        return;
    }

    const new_token = randomBytes(32).toString("hex");
    res.status(201).json({refresh_token: new_token});
}

router.use("/refresh", refresh())

export default router;