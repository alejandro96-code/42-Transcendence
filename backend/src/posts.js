import express from 'express';
import { formatErrorJson } from './utils.js';
import { pool } from "./db.js";
import { verify_token } from './token.js';
import {
    addNotification,
    getProfileViewers,
} from './notifications.js';

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

function serializeAttachment(attachment) {
    if (!attachment || typeof attachment !== 'object') {
        return null;
    }

    const data = typeof attachment.data === 'string' ? attachment.data : '';
    const match = data.match(/^data:[^;,]*(?:;[^;,]*)*;base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) {
        return null;
    }

    const buffer = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
    if (buffer.length === 0 || buffer.length > MAX_ATTACHMENT_SIZE) {
        return null;
    }

    return JSON.stringify({
        data,
        name: String(attachment.name || 'attachment').slice(0, 255),
        type: String(attachment.type || 'application/octet-stream').slice(0, 255),
    });
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
            "Couldn't read posts",
            "POSTS_LOAD_FAILED"
        );

        res.status(500).json(responseBody);
    }
}

async function create_post(req, res) {
    try {
        const serializedAttachment = serializeAttachment(req.body.attachment);
        if (req.body.attachment && !serializedAttachment) {
            return res.status(400).json(formatErrorJson(
                400,
                "Bad Request",
                "Attachment must be a valid file no larger than 2 MB",
                "POST_ATTACHMENT_INVALID",
                { maxSizeMB: 2 }
            ));
        }
        const media = serializedAttachment
            ? [serializedAttachment]
            : (req.body.image ? [req.body.image] : []);
        const authorId = req.user.id;
        const content = String(req.body?.content ?? '').trim();

        if (!content || content.length == 0) {
            return res.status(400).json(formatErrorJson(400, "Bad Request", "Message content can't be empty!", "POST_CONTENT_EMPTY"))
        }

        if (content.length > 200) {
            return res.status(413).json(
                formatErrorJson(
                    413,
                    "Content Too Large",
                    "Content must be between 1 and 1000 characters long",
                    "POST_CONTENT_TOO_LONG",
                    { max: 200 }
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
                    "Post author not found in Database",
                    "POST_AUTHOR_NOT_FOUND"
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
                    "Something went bad on post creation",
                    "POST_CREATE_FAILED"
                )
            );
        }

        const mentionedUsernames = [...new Set(
            content.match(/@([a-zA-Z0-9_]+)/g)?.map(
                mention => mention.substring(1)
            ) || []
        )];

        if (mentionedUsernames.length > 0) {
            const mentionedUsers = await pool.query(
                `SELECT id, username
                FROM users
                WHERE LOWER(username) = ANY($1::text[])`,
                [mentionedUsernames.map(username => username.toLowerCase())]
            );

        mentionedUsers.rows.forEach((user) => {
            if (user.id !== authorId) {
                addNotification(user.id, {
                    type: 'post_mention',
                    params: { username: author_username.rows[0].username },
                });
            }
            });
        }

        for (const viewerId of getProfileViewers(authorId)) {
            if (viewerId !== authorId) {
                addNotification(viewerId, {
                    type: 'post_created',
                    params: { username: author_username.rows[0].username },
                });
            }
        }

        return res.status(201).json(new_post.rows[0]);
    } catch (error) {
        return res.status(500).json(formatErrorJson(500, "Internal Server Error", "Something went bad on post creation", "POST_CREATE_FAILED"));
    }
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
            "Post not found or you are not the author",
            "POST_NOT_FOUND"
        );
        return res.status(404).json(responseBody);
    }

    const deletedPost = deleted_post.rows[0];
    const authorUsername = deletedPost.author_username || '';

    for (const viewerId of getProfileViewers(req.user.id)) {
        if (viewerId !== req.user.id) {
            addNotification(viewerId, {
                type: 'post_deleted',
                params: { username: authorUsername },
            });
        }
    }

    return res.status(204).end();
}

const router = express.Router();

router.use(express.json());

router.get("/", verify_token, read_posts);
router.post("/", verify_token, create_post);
router.delete("/", verify_token, delete_post);

export default router;
