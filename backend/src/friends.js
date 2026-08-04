import express from 'express';
import { pool } from './db.js';
import { isAuthenticated } from './utils.js';

const router = express.Router();

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url, users.profession, users.description
             FROM friend_requests
             JOIN users ON users.id = CASE
                 WHEN friend_requests.requester_id = $1 THEN friend_requests.recipient_id
                 ELSE friend_requests.requester_id
             END
             WHERE friend_requests.status = 'accepted'
               AND (friend_requests.requester_id = $1 OR friend_requests.recipient_id = $1)
             ORDER BY LOWER(users.username)`,
            [req.user.id],
        );
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener amigos:', error);
        return res.status(500).json({ error: 'No se pudieron obtener los amigos.' });
    }
});

router.get('/user/:userId', isAuthenticated, async (req, res) => {
    const userId = Number.parseInt(req.params.userId, 10);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'Usuario inválido.' });
    }

    try {
        if (userId !== req.user.id) {
            const allowedResult = await pool.query(
                `SELECT 1
                 FROM friend_requests
                 WHERE status = 'accepted'
                   AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))
                 LIMIT 1`,
                [req.user.id, userId],
            );

            if (allowedResult.rows.length === 0) {
                return res.status(403).json({ error: 'No puedes ver los amigos de este usuario.' });
            }
        }

        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url, users.profession, users.description
             FROM friend_requests
             JOIN users ON users.id = CASE
                 WHEN friend_requests.requester_id = $1 THEN friend_requests.recipient_id
                 ELSE friend_requests.requester_id
             END
             WHERE friend_requests.status = 'accepted'
               AND (friend_requests.requester_id = $1 OR friend_requests.recipient_id = $1)
             ORDER BY LOWER(users.username)`,
            [userId],
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los amigos del usuario:', error);
        return res.status(500).json({ error: 'No se pudieron obtener los amigos del usuario.' });
    }
});

router.get('/search', isAuthenticated, async (req, res) => {
    const query = String(req.query?.q ?? '').trim();

    if (!query) {
        return res.json([]);
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url, users.profession, users.description
             FROM friend_requests
             JOIN users ON users.id = CASE
                 WHEN friend_requests.requester_id = $1 THEN friend_requests.recipient_id
                 ELSE friend_requests.requester_id
             END
             WHERE friend_requests.status = 'accepted'
               AND (friend_requests.requester_id = $1 OR friend_requests.recipient_id = $1)
               AND (
                 LOWER(users.username) LIKE LOWER($2)
                 OR LOWER(users.full_name) LIKE LOWER($2)
               )
             ORDER BY LOWER(users.username)
             LIMIT 8`,
            [req.user.id, `%${query}%`],
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error al buscar amigos:', error);
        return res.status(500).json({ error: 'No se pudo buscar entre tus amigos.' });
    }
});

router.get('/:friendId/profile', isAuthenticated, async (req, res) => {
    const friendId = Number.parseInt(req.params.friendId, 10);

    if (!Number.isInteger(friendId)) {
        return res.status(400).json({ error: 'Amigo inválido.' });
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.email, users.full_name, users.avatar_url, users.profession, users.description
             FROM users
             WHERE users.id = $1
               AND (
                 users.id = $2
                 OR EXISTS (
                     SELECT 1
                     FROM friend_requests
                     WHERE friend_requests.status = 'accepted'
                       AND ((friend_requests.requester_id = $2 AND friend_requests.recipient_id = users.id)
                         OR (friend_requests.requester_id = users.id AND friend_requests.recipient_id = $2))
                 )
               )
             LIMIT 1`,
            [friendId, req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado.' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el perfil del amigo:', error);
        return res.status(500).json({ error: 'No se pudo obtener el perfil.' });
    }
});

router.get('/requests', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT friend_requests.id, users.username, users.email, friend_requests.created_at
             FROM friend_requests
             JOIN users ON users.id = friend_requests.requester_id
             WHERE friend_requests.recipient_id = $1 AND friend_requests.status = 'pending'
             ORDER BY friend_requests.created_at DESC`,
            [req.user.id],
        );
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        return res.status(500).json({ error: 'No se pudieron obtener las solicitudes.' });
    }
});

router.post('/requests', isAuthenticated, async (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    if (!username) return res.status(400).json({ error: 'El nick es obligatorio.' });

    try {
        const recipientResult = await pool.query(
            'SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
            [username],
        );
        const recipient = recipientResult.rows[0];
        if (!recipient) return res.status(404).json({ error: 'Ese usuario no existe.' });
        if (recipient.id === req.user.id) return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo.' });

        const existing = await pool.query(
            `SELECT id, status FROM friend_requests
             WHERE (requester_id = $1 AND recipient_id = $2)
                OR (requester_id = $2 AND recipient_id = $1)
             LIMIT 1`,
            [req.user.id, recipient.id],
        );
        if (existing.rows.length > 0) {
            const request = existing.rows[0];
            if (request.status === 'accepted') return res.status(409).json({ error: 'Ya sois amigos.' });
            if (request.status === 'pending') return res.status(409).json({ error: 'Ya existe una solicitud pendiente entre ambos usuarios.' });
            await pool.query(
                `UPDATE friend_requests
                 SET requester_id = $1, recipient_id = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [req.user.id, recipient.id, request.id],
            );
            return res.status(201).json({ message: 'Solicitud enviada.' });
        }

        await pool.query(
            'INSERT INTO friend_requests (requester_id, recipient_id) VALUES ($1, $2)',
            [req.user.id, recipient.id],
        );
        return res.status(201).json({ message: 'Solicitud enviada.' });
    } catch (error) {
        console.error('Error al crear solicitud:', error);
        return res.status(500).json({ error: 'No se pudo enviar la solicitud.' });
    }
});

router.patch('/requests/:requestId', isAuthenticated, async (req, res) => {
    const requestId = Number.parseInt(req.params.requestId, 10);
    const status = req.body?.status;
    if (!Number.isInteger(requestId) || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Solicitud o acción inválida.' });
    }

    try {
        const result = await pool.query(
            `UPDATE friend_requests SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND recipient_id = $3 AND status = 'pending'
             RETURNING id`,
            [status, requestId, req.user.id],
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' });
        return res.json({ message: status === 'accepted' ? 'Solicitud aceptada.' : 'Solicitud rechazada.' });
    } catch (error) {
        console.error('Error al responder solicitud:', error);
        return res.status(500).json({ error: 'No se pudo actualizar la solicitud.' });
    }
});

router.delete('/:friendId', isAuthenticated, async (req, res) => {
    const friendId = Number.parseInt(req.params.friendId, 10);
    if (!Number.isInteger(friendId)) return res.status(400).json({ error: 'Amigo inválido.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `DELETE FROM friend_requests
             WHERE status = 'accepted'
               AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))
             RETURNING id`,
            [req.user.id, friendId],
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Amigo no encontrado.' });
        }
        await client.query(
            `DELETE FROM messages
             WHERE (sender_id = $1 AND recipient_id = $2)
                OR (sender_id = $2 AND recipient_id = $1)`,
            [req.user.id, friendId],
        );
        await client.query('COMMIT');
        return res.status(204).end();
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar amigo:', error);
        return res.status(500).json({ error: 'No se pudo eliminar el amigo.' });
    } finally {
        client.release();
    }
});

export default router;
