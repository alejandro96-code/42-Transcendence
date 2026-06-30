import express from 'express';

export const postsCreateSchema = {
    type: "object",
    required: [
        "author_id",
        "content",
    ],
    properties: {
        author_id: {
            type: "number"
        },
        content: {
            type: "string",
            maxLength: 240,
        },
        author_username: {
            type: "string",
            minLength: 3,
            maxLength: 50,
            pattern: "^[a-zA-Z0-9_]*$"
        }
    }
};