import { Validator } from "express-json-validator-middleware";

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

export const { validate } = new Validator({ allErrors: true });