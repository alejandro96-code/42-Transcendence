import express, { response } from 'express';
import { Validator } from "express-json-validator-middleware";

// Middleware to verify authentication
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json(formatErrorJson(401, "Unauthorized", "Not Authenticated"));
};

export function formatErrorJson(code, error, description) {
    const errorBody = {
        "code": code,
        "phrase": error,
        "error": description
    }

    return errorBody;
}

export function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash) {
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

export const { validate } = new Validator({ allErrors: true });