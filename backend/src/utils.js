import express, { response } from 'express';
import { Validator } from "express-json-validator-middleware";

// Middleware para verificar autenticación
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json(formatErrorJson(401, "Unauthorized", "Not Authenticated"));
};

export function formatErrorJson(code, error, description) {
    const errorBody = {
        "code": code,
        "error": error,
        "description": description
    }

    return errorBody;
}

export const { validate } = new Validator({ allErrors: true });