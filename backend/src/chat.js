import express from 'express';
import { pool } from './db.js';
import { isAuthenticated } from './utils.js';
import { containsProfanity } from './profanity.js';

const router = express.Router();

function getRecipientId(value) {
    const recipientId = Number.parseInt(value, 10);
    return Number.isInteger(recipientId) && recipientId > 0 ? recipientId : null;
}

router.get('/:recipientId', isAuthenticated, async (req, res) => {
    const recipientId = getRecipientId(req.params.recipientId);
    if (!recipientId || recipientId === req.user.id) {
        return res.status(400).json({ error: 'Destinatario inválido.' });
    }

    try {
        const result = await pool.query(
            `SELECT id, sender_id, recipient_id, content, created_at
             FROM messages
             WHERE (sender_id = $1 AND recipient_id = $2)
                OR (sender_id = $2 AND recipient_id = $1)
             ORDER BY created_at ASC, id ASC`,
            [req.user.id, recipientId],
        );
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        return res.status(500).json({ error: 'No se pudieron obtener los mensajes.' });
    }
});

router.post('/:recipientId', isAuthenticated, async (req, res) => {
    const recipientId = getRecipientId(req.params.recipientId);
    const content = String(req.body?.content ?? '').trim();
    if (!recipientId || recipientId === req.user.id) {
        return res.status(400).json({ error: 'Destinatario inválido.' });
    }
    if (!content || content.length > 1000) {
        return res.status(400).json({ error: 'El mensaje debe tener entre 1 y 1000 caracteres.' });
    }
    
    if (containsProfanity(content)) {
    return res.status(400).json({
        error: 'El mensaje contiene palabras no permitidas.'
    });
}

    try {
        const recipient = await pool.query('SELECT id FROM users WHERE id = $1', [recipientId]);
        if (recipient.rows.length === 0) {
            return res.status(404).json({ error: 'El usuario destinatario no existe.' });
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_id, recipient_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, sender_id, recipient_id, content, created_at`,
            [req.user.id, recipientId, content],
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        return res.status(500).json({ error: 'No se pudo enviar el mensaje.' });
    }
});

export default router;
