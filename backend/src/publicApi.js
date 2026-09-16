import express from 'express';
import { pool } from './db.js';
import { formatErrorJson } from './utils.js';

const MAX_CONTENT_LENGTH = 200;

function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.PUBLIC_API_KEY;

    if (!expectedKey) {
        console.error('PUBLIC_API_KEY is not configured');
        return res.status(500).json(
            formatErrorJson(500, "Internal server error", "Public API is not configured", "SERVER_ERROR")
        );
    }

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json(
            formatErrorJson(401, "Unauthorized", "Missing or invalid API key", "PUBLIC_API_KEY_INVALID")
        );
    }

    return next();
}

async function list_users(req, res) {
    try {
        const amount = Number(req.query.amount) || 50;

        const result = await pool.query(
            `SELECT id, username, full_name, avatar_url, profession, description
             FROM users
             ORDER BY id
             FETCH FIRST $1 ROWS ONLY`,
            [amount]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error listing users (public API):', error);
        return res.status(500).json(
            formatErrorJson(500, "Internal Server Error", "Couldn't read users", "PUBLIC_USERS_LOAD_FAILED")
        );
    }
}

async function list_posts(req, res) {
    try {
        const amount = Number(req.query.amount) || 50;

        const result = await pool.query(
            `SELECT id, author_id, author_username, content, media, created_at, updated_at
             FROM posts
             ORDER BY created_at DESC
             FETCH FIRST $1 ROWS ONLY`,
            [amount]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error listing posts (public API):', error);
        return res.status(500).json(
            formatErrorJson(500, "Internal Server Error", "Couldn't read posts", "PUBLIC_POSTS_LOAD_FAILED")
        );
    }
}

async function create_post(req, res) {
    const authorId = Number.parseInt(req.body?.author_id, 10);
    const content = String(req.body?.content ?? '').trim();

    if (!Number.isInteger(authorId)) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "author_id must be a valid user id", "PUBLIC_POST_INVALID_AUTHOR")
        );
    }

    if (!content || content.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", `content is required and must be at most ${MAX_CONTENT_LENGTH} characters long`, "PUBLIC_POST_INVALID_CONTENT", { max: MAX_CONTENT_LENGTH })
        );
    }

    try {
        const author = await pool.query('SELECT username FROM users WHERE id = $1', [authorId]);

        if (author.rows.length === 0) {
            return res.status(404).json(
                formatErrorJson(404, "Not Found", "Author not found", "PUBLIC_POST_AUTHOR_NOT_FOUND")
            );
        }

        const result = await pool.query(
            `INSERT INTO posts (author_id, author_username, content)
             VALUES ($1, $2, $3)
             RETURNING id, author_id, author_username, content, media, created_at, updated_at`,
            [authorId, author.rows[0].username, content]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating post (public API):', error);
        return res.status(500).json(
            formatErrorJson(500, "Internal Server Error", "Couldn't create post", "PUBLIC_POST_CREATE_FAILED")
        );
    }
}

async function update_post(req, res) {
    const postId = Number.parseInt(req.params.postId, 10);
    const content = String(req.body?.content ?? '').trim();

    if (!Number.isInteger(postId)) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Invalid post id", "PUBLIC_POST_INVALID_ID")
        );
    }

    if (!content || content.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", `content is required and must be at most ${MAX_CONTENT_LENGTH} characters long`, "PUBLIC_POST_INVALID_CONTENT", { max: MAX_CONTENT_LENGTH })
        );
    }

    try {
        const result = await pool.query(
            `UPDATE posts
             SET content = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, author_id, author_username, content, media, created_at, updated_at`,
            [content, postId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorJson(404, "Not Found", "Post not found", "PUBLIC_POST_NOT_FOUND")
            );
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating post (public API):', error);
        return res.status(500).json(
            formatErrorJson(500, "Internal Server Error", "Couldn't update post", "PUBLIC_POST_UPDATE_FAILED")
        );
    }
}

async function delete_post(req, res) {
    const postId = Number.parseInt(req.params.postId, 10);

    if (!Number.isInteger(postId)) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Invalid post id", "PUBLIC_POST_INVALID_ID")
        );
    }

    try {
        const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING id', [postId]);

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorJson(404, "Not Found", "Post not found", "PUBLIC_POST_NOT_FOUND")
            );
        }

        return res.status(204).end();
    } catch (error) {
        console.error('Error deleting post (public API):', error);
        return res.status(500).json(
            formatErrorJson(500, "Internal Server Error", "Couldn't delete post", "PUBLIC_POST_DELETE_FAILED")
        );
    }
}

const router = express.Router();

router.use(express.json());
router.use(requireApiKey);

router.get('/users', list_users);
router.get('/posts', list_posts);
router.post('/posts', create_post);
router.put('/posts/:postId', update_post);
router.delete('/posts/:postId', delete_post);

export default router;
