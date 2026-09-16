import express, { response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Validator } from "express-json-validator-middleware";

// Middleware to verify authentication
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json(formatErrorJson(401, "Unauthorized", "Not Authenticated", "AUTH_REQUIRED"));
};

// `errorCode` is a stable, language-independent identifier the frontend maps
// to a translated message (see frontend/src/services/apiError.ts); `error`
// stays as an English description for logs/debugging tools.
export function formatErrorJson(code, error, description, errorCode, params) {
    const errorBody = {
        "code": code,
        "phrase": error,
        "error": description,
        "errorCode": errorCode || "SERVER_ERROR",
    }

    if (params) {
        errorBody.params = params;
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

// Date doesn't have a method to add n amount of hours
// For some reason
// This implements it
Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

export const { validate } = new Validator({ allErrors: true });