import express from 'express';
import { formatErrorJson, isAuthenticated, validate } from './utils.js';
import { pool } from "./db.js";
import { containsProfanity } from './profanity.js';
import { verify_token } from './token.js';
import { format } from 'path';

async function read_comments(req, res) {
    const posts_lists = await pool.query(
        'SELECT * FROM posts WHERE parent = $1 FETCH FIRST $2 ROWS ONLY',
        [req.body.parent, req.body.amount || 50]
    );

    if (!posts_lists || posts_lists.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not Found", "No posts were found in database");
        return res.status(404).json(responseBody);
    }

    res.json(posts_lists.rows);
}

async function read_posts(req, res) {
    try {
        const targetUser = req.query.user || req.user.id;
        const amount = Number(req.query.amount) || 50;
        const filter = req.query.filter;

        if (filter === 'mentions') {
            const mentions_posts = await pool.query(
                `
                SELECT p.*
                FROM posts p
                JOIN users mentioned
                    ON mentioned.id = $1
                JOIN friend_requests fr
                    ON fr.status = 'accepted'
                    AND (
                        (
                            fr.sender_id = p.author_id
                            AND fr.receiver_id = $1
                        )
                        OR
                        (
                            fr.receiver_id = p.author_id
                            AND fr.sender_id = $1
                        )
                    )
                WHERE p.content ~ (
                    '(^|[^a-zA-Z0-9_])@'
                    || mentioned.username
                    || '([^a-zA-Z0-9_]|$)'
                )
                ORDER BY p.created_at DESC
                FETCH FIRST $2 ROWS ONLY
                `,
                [req.user.id, amount]
            );

            res.json(mentions_posts.rows);
            return;
        }

        const posts_lists = await pool.query(
            ` SELECT * FROM posts WHERE author_id = $1 ORDER BY created_at DESC FETCH FIRST $2 ROWS ONLY `,
            [targetUser, amount]
        );

        res.json(posts_lists.rows);

    } catch (error) {
        const responseBody = formatErrorJson(
            500,
            "Internal Server Error",
            "Couldn't read posts"
        );

        res.status(500).json(responseBody);
    }
}

async function create_post(req, res) {
    try {
        const media = req.body.image ? [req.body.image] : [];
        const authorId = req.user.id;
        const content = String(req.body?.content ?? '').trim();

        if (!content || content.length == 0) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", "Message content can't be empty!"))
        }

        if (containsProfanity(content)) {
            return res.status(400).json(
                formatErrorJson(
                    400,
                    "Bad Request",
                    "The media contains vulgar words"
                )
            );
        }

        const author_username = await pool.query(
            'SELECT username FROM users WHERE id = $1',
            [authorId]
        );

        if (!author_username || author_username.rows.length === 0) {
            return res.status(404).json(
                formatErrorJson(
                    404,
                    "Not found",
                    "Post author not found in Database"
                )
            );
        }

        const parent = req.body.parent ? req.body.parent : 0;
        
        const new_post = await pool.query(
            `INSERT INTO posts (
                author_id,
                author_username,
                content,
                media,
                parent
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                authorId,
                author_username.rows[0].username,
                content,
                media,
                parent
            ]
        );

        if (!new_post || new_post.rows.length === 0) {
            return res.status(500).json(
                formatErrorJson(
                    500,
                    "Internal Server Error",
                    "Something went bad on post creation"
                )
            );
        }

        return res.status(201).json(new_post.rows);
    } catch (error) {
        return res.status(500).json(formatErrorJson(500, "Internal Server Error", "Something went bad on post creation"));
    }
}

async function create_comment(req, res) {
    const parent = req.body.parent ? req.body.parent : 0

    const new_post = await pool.query(
            `INSERT INTO posts (author_id, author_username, content, media, parent)
            VALUES($1, $2, $3, $4, $5) RETURNING *
            `,
            [
                req.body.author_id, author_username.rows[0].username,
                req.body.content, media, parent
            ]
        );

    if (!new_post || new_post.rows.length === 0) {
        let responseBody = formatErrorJson(500, "Internal Server Error", "Something went bad on post creation");
        return res.status(500).json(responseBody);
    }

    res.status(201).json(new_post.rows);
}

async function delete_post(req, res) {
    const deleted_post = await pool.query(
        `DELETE FROM posts
         WHERE id = $1 AND author_id = $2
         RETURNING *`,
        [
            req.body.id,
            req.user.id
        ]
    );

    if (!deleted_post || deleted_post.rows.length === 0) {
        const responseBody = formatErrorJson(
            404,
            "Not Found",
            "Post not found or you are not the author"
        );
        return res.status(404).json(responseBody);
    }

    return res.status(204).end();
}

const router = express.Router();

router.use(express.json());

router.get("/comments", verify_token, read_comments);
router.post("/comments", verify_token, create_comment);
router.get("/", verify_token, read_posts);
router.post("/", verify_token, create_post);
router.delete("/", verify_token, delete_post);

export default router;
