import express from 'express';
import { formatErrorJson, isAuthenticated } from './utils.js';
import { pool } from './db.js';
import { containsProfanity } from './profanity.js';
import { verify_token } from './token.js';

function getRecipientId(value) {
    const recipientId = Number(value);
    return Number.isSafeInteger(recipientId) && recipientId > 0 ? recipientId : null;
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
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Wrong recipientId")
        );
    }

    const user_row = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [recipientId]
    );

    if (!user_row || user_row.rows.length === 0) {
        return res.status(404).json(
            formatErrorJson(404, 'Not Found', 'Recipient not found')
        );
    }

    const messages_lists = await pool.query(
        `SELECT id,
                sender_id,
                receiver_id,
                content,
                sent_at AS created_at
         FROM chat_messages
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY sent_at ASC, id ASC
         FETCH FIRST $3 ROWS ONLY`,
        [
            req.user.id,
            recipientId,
            req.body?.amount || 20
        ]
    );

    return res.json(messages_lists.rows);
}

async function create_message(req, res) {
    const recipientId = getRecipientId(req.params.recipientId);
    const content = String(req.body?.content ?? '').trim();

    if (!recipientId || recipientId === req.user.id) {
        return res.status(400).json(
            formatErrorJson(400, 'Bad Request', 'Wrong recipientId')
        );
    }

    if (!content || content.length > 1000) {
        return res.status(400).json(
            formatErrorJson(
                400,
                'Bad Request',
                'Content must be between 1 and 1000 characters long'
            )
        );
    }

    if (containsProfanity(content)) {
        return res.status(400).json(
            formatErrorJson(
                400,
                'Bad Request',
                'The message contains non allowed or vulgar words.'
            )
        );
    }

    const recipient = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [recipientId]
    );

    if (!recipient || recipient.rows.length === 0) {
        return res.status(404).json(
            formatErrorJson(404, 'Not Found', 'Recipient not found')
        );
    }

    const result = await pool.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)
         RETURNING id,
                   sender_id,
                   receiver_id,
                   content,
                   sent_at AS created_at`,
        [
            req.user.id,
            recipientId,
            content
        ]
    );

    return res.status(201).json(result.rows[0]);
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

router.get('/:recipientId', verify_token, read_messages);
router.post('/:recipientId', verify_token, create_message);

export default router;
