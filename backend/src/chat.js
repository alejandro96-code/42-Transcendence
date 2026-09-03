import express from 'express';
import { formatErrorJson} from './utils.js';
import { pool } from './db.js';
import { verify_token } from './token.js';
import { addNotification } from './notifications.js';

function getRecipientId(value) {
    const recipientId = Number(value);
    return Number.isSafeInteger(recipientId) && recipientId > 0 ? recipientId : null;
}

async function update_message(req, res) {
    const messageId = Number(req.body?.id);
    const content = String(req.body?.new_body ?? req.body?.content ?? '').trim();

    if (!Number.isSafeInteger(messageId) || messageId <= 0 || !content || content.length > 1000) {
        return res.status(400).json(formatErrorJson(
            400, "Bad Request", "id must be a positive integer and content must contain 1 to 1000 characters"
        ));
    }

    const updatedMessage = await pool.query(
        `UPDATE chat_messages
         SET content = $1
         WHERE id = $2 AND sender_id = $3
         RETURNING id, sender_id, receiver_id, content, sent_at AS created_at`,
        [content, messageId, req.user.id]
    );

    if (updatedMessage.rows.length === 0) {
        return res.status(404).json(formatErrorJson(
            404, "Not Found", "Message not found or you are not the sender"
        ));
    }

    return res.json(updatedMessage.rows[0]);
}

async function read_messages(req, res) {
    const recipientId = getRecipientId(req.params.recipientId);

    if (!recipientId || recipientId === req.user.id) {
        let responseBody = formatErrorJson(400, "Bad Request", "Wrong recipientId");
        return res.status(400).json(responseBody);
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

    if (!messages_lists || messages_lists.rows.length === 0) {
        return res.status(200).json([]);
    }

    return res.json(messages_lists.rows);
}

async function create_message(req, res) {
    const recipientId = getRecipientId(req.params.recipientId);
    const content = String(req.body?.content ?? '').trim();

    if (!recipientId || recipientId === req.user.id) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Wrong recipientId")
        );
    }

    if (!content || content.length > 1000) {
        return res.status(413).json(
            formatErrorJson(
                413,
                "Content Too Large",
                "Content must be between 1 and 1000 characters long"
            )
        );
    }

    const recipient = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [recipientId]
    );

    if (!recipient || recipient.rows.length === 0) {
        return res.status(404).json(
            formatErrorJson(
                404,
                "Not found",
                "Message receiver not found in Database"
            )
        );
    }

    const new_message = await pool.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, receiver_id AS recipient_id,
                   content, sent_at AS created_at`,
        [req.user.id, recipientId, content]
    );

    if (!new_message || new_message.rows.length === 0) {
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                "Something went bad on message creation"
            )
        );
    }
    const sender = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [req.user.id]
        );

        addNotification(recipientId, {
            type: 'new_message',
            message: `${sender.rows[0].username} te ha enviado un mensaje`,
        }
    );

    return res.status(201).json(new_message.rows[0]);
}

async function delete_message(req, res) {
    const messageId = Number(req.body?.id);
    const senderId = Number(req.body?.sender_id ?? req.user.id);

    if (!Number.isSafeInteger(messageId) || messageId <= 0 ||
        !Number.isSafeInteger(senderId) || senderId !== req.user.id) {
        return res.status(400).json(formatErrorJson(
            400, "Bad Request", "id and sender_id are required and sender_id must match the authenticated user"
        ));
    }

    const deletedMessage = await pool.query(
        `DELETE FROM chat_messages
         WHERE id = $1 AND sender_id = $2
         RETURNING id`,
        [messageId, senderId]
    );

    if (deletedMessage.rows.length === 0) {
        return res.status(404).json(formatErrorJson(
            404, "Not Found", "Message not found or you are not the sender"
        ));
    }

    return res.status(204).end();
}

const router = express.Router();

router.use(express.json());

router.get('/:recipientId', verify_token, read_messages);
router.post('/:recipientId', verify_token, create_message);
router.patch("/", verify_token, update_message);
router.delete("/", verify_token, delete_message);

export default router;
