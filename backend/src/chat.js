import express from 'express';
import { formatErrorJson, isAuthenticated, validate } from './utils.js';
import { pool } from './db.js';
import { isAuthenticated } from './utils.js';
import { containsProfanity } from './profanity.js';

const router = express.Router();

function getRecipientId(value) {
    const recipientId = Number.parseInt(value, 10);
    return Number.isInteger(recipientId) && recipientId > 0 ? recipientId : null;
}

async function update_message(req, res) {

    const original_message = await pool.query(
        'SELECT * FROM chat_messages WHERE id = $1',
        [
            req.body.sender, req.body.receiver, req.body.amount || 20
        ]
    );
        
    if (!original_message || original_message.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not Found", "No messages were found in database");
        res.status(404).json(responseBody);
        return;
    }

    const updated_message = await pool.query(
            'UPDATE * FROM chat_messages WHERE id = $1',
            [
                req.body.id, req.body.new_body, req.body.amount || 20
            ]
        );
    
}

async function read_messages(req, res) {
    const recipientId = getRecipientId(req.params.recipientId);
    if (!recipientId || recipientId === req.user.id) {
        let responseBody = formatErrorJson(400, "Bad Request", "Wrong recipientId");
        res.status(400).json(responseBody);
        return;
    }

    const messages_lists = await pool.query(
            `SELECT * 
             FROM chat_messages
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
                ORDER BY created_at ASC, id ASC
                FETCH FIRST $3 ROWS ONLY`,
            [
                req.user.id, recipientId, req.body.amount || 20
            ]
        );

    if (!messages_lists || messages_lists.rows.length === 0) {
        let responseBody = formatErrorJson(404, "Not Found", "No messages were found in database");
        res.status(404).json(responseBody);
    } else {
        res.json(messages_lists.rows);
    }
    
}

async function create_message(req, res) {
    const recipientId = getRecipientId(req.params.recipientId);
    const content = String(req.body?.content ?? '').trim();
    if (!recipientId || recipientId === req.user.id) {
        let responseBody = formatErrorJson(400, "Bad Request", "Wrong recipientId");
        res.status(400).json(responseBody);
        return;
    } else if (!content || content.length > 1000) {
        let responseBody = formatErrorJson(413, "Content Too Large", "Content must be between 1 and 1000 characters long");
        res.status(413).json(responseBody);
    }
    
    if (containsProfanity(content)) {
    return res.status(400).json({
        error: 'El mensaje contiene palabras no permitidas.'
    });
}

    const chat_users = await pool.query(
            'SELECT id FROM users WHERE (id = $1) OR (id = $2)',
            [
                req.body.sender, req.body.receiver
            ]
        );

    if (!chat_users || chat_users.rows.length < 2) {
        let responseBody = formatErrorJson(404, "Not found", "Message sender or receiver not found in Database");
        res.status(404).json(responseBody);
        return;
    }

    const new_post = await pool.query(
            `INSERT INTO posts (sender_id, recipient_id, content)
            VALUES($1, $2, $3) RETURNING *
            `,
            [
                chat_users, chat_users.rows[0].username, content
            ]
        );

    if (!new_post || new_post.rows.length === 0) {
        let responseBody = formatErrorJson(500, "Internal Server Error", "Something went bad on post creation");
        res.status(500).json(responseBody);
    } else {
        res.json(new_post.rows);
    }
    
}

async function delete_message(req, res) {

    const deleted_post = await pool.query(
            `DELETE FROM chat_messages where id = $1`,
            [
                req.body.id
            ]
        );

    if (!deleted_post || deleted_post.rows.length === 0) {
        let responseBody = formatErrorJson(500, "Internal Server Error", "Something went bad on post creation");
        res.status(500).json(responseBody);
    } else {
        res.status(204);
    }
    
}

const router = express.Router();

router.use(express.json());

router.get("/", read_messages);

router.patch("/", async (req, res) => {
    const responseBody = await update_message(req, res);
    res.json(responseBody);
});

router.post("/", async (req, res) => {
    const responseBody = await create_message(req, res);
    res.json(responseBody);
});

router.delete("/", async (req, res) => {
    const responseBody = await delete_message(req, res);
    res.json(responseBody);
});

export default router;
