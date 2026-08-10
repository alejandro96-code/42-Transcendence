export const postsCreateSchema = {
    type: "object",
    required: [
        "content",
    ],
    properties: {
        content: {
            type: "string",
            maxLength: 240,
        },
        author_id: {
            type: "number"
        },
        author_username: {
            type: "string",
            minLength: 3,
            maxLength: 50,
            pattern: "^[a-zA-Z0-9_]*$"
        }
    }
};