import express from 'express';
import { formatErrorJson, isAuthenticated } from './utils.js';
import { pool } from './db.js';
import { containsProfanity } from './profanity.js';

const router = express.Router();

router.use(express.json());

function getRecipientId(value) {
    const recipientId = Number(value);
    return Number.isSafeInteger(recipientId) && recipientId > 0 ? recipientId : null;
}

async function findRecipient(recipientId) {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [recipientId]);
    return result.rows[0] ?? null;
}

router.get('/:recipientId', isAuthenticated, async (req, res) => {
    const recipientId = getRecipientId(req.params.recipientId);
    if (!recipientId || recipientId === req.user.id) {
        return res.status(400).json(formatErrorJson(400, 'Bad Request', 'Wrong recipientId'));
    }

    try {
        if (!await findRecipient(recipientId)) {
            return res.status(404).json(formatErrorJson(404, 'Not Found', 'Recipient not found'));
        }

        const result = await pool.query(
            `SELECT id, sender_id, receiver_id AS recipient_id, content, sent_at AS created_at
             FROM chat_messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY sent_at ASC, id ASC`,
            [req.user.id, recipientId],
        );
        
        return res.json(result.rows);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        return res.status(500).json(formatErrorJson(500, 'Internal Server Error', 'Could not retrieve messages'));
    }
});

router.post('/:recipientId', isAuthenticated, async (req, res) => {
    const recipientId = getRecipientId(req.params.recipientId);
    const content = String(req.body?.content ?? '').trim();

    if (!recipientId || recipientId === req.user.id) {
        return res.status(400).json(formatErrorJson(400, 'Bad Request', 'Wrong recipientId'));
    }
    if (!content || content.length > 1000) {
        return res.status(400).json(formatErrorJson(400, 'Bad Request', 'Content must be between 1 and 1000 characters long'));
    }
    if (containsProfanity(content)) {
        return res.status(400).json({ error: 'El mensaje contiene palabras no permitidas.' });
    }

    try {
        if (!await findRecipient(recipientId)) {
            return res.status(404).json(formatErrorJson(404, 'Not Found', 'Recipient not found'));
        }

        const result = await pool.query(
            `INSERT INTO chat_messages (sender_id, receiver_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, sender_id, receiver_id AS recipient_id, content, sent_at AS created_at`,
            [req.user.id, recipientId, content],
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating message:', error);
        return res.status(500).json(formatErrorJson(500, 'Internal Server Error', 'Could not create message'));
    }
});

export default router;
