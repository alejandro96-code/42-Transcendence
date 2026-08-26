import express from 'express';
import { pool } from './db.js';
import { formatErrorJson, isAuthenticated } from './utils.js';
import { verify_token } from './token.js'

const router = express.Router();

router.get('/', verify_token, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url, users.profession, users.description, users.last_seen,
                CASE
                    WHEN users.last_seen > CURRENT_TIMESTAMP - INTERVAL '20 seconds'
                    THEN true
                    ELSE false
                END AS is_online
             FROM friend_requests
             JOIN users ON users.id = CASE
                 WHEN friend_requests.sender_id = $1
                 THEN friend_requests.receiver_id
                 ELSE friend_requests.sender_id
             END
             WHERE friend_requests.status = 'accepted'
               AND (
                   friend_requests.sender_id = $1
                   OR friend_requests.receiver_id = $1
               )
             ORDER BY LOWER(users.username)`,
            [req.user.id],
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error retrieving friends: ', error);
        return res.status(500).json(formatErrorJson(500, "Internal Server Error", `Error retrieving friends: ${error}`));
    }
});

router.get('/user/:userId', verify_token, async (req, res) => {
    const userId = Number.parseInt(req.params.userId, 10);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'Invalid user.' });
    }

    try {
        if (userId !== req.user.id) {
            const allowedResult = await pool.query(
                `SELECT 1
                 FROM friend_requests
                 WHERE status = 'accepted'
                   AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
                 LIMIT 1`,
                [req.user.id, userId],
            );

            if (allowedResult.rows.length === 0) {
                return res.status(403).json({ error: 'You can not see the friends of this user.' });
            }
        }

        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url, users.profession, users.description, users.last_seen
             FROM friend_requests
             JOIN users ON users.id = CASE
                 WHEN friend_requests.sender_id = $1 THEN friend_requests.receiver_id
                 ELSE friend_requests.sender_id
             END
             WHERE friend_requests.status = 'accepted'
               AND (friend_requests.sender_id = $1 OR friend_requests.receiver_id = $1)
             ORDER BY LOWER(users.username)`,
            [userId],
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error retrieving the friends of this user:', error);
        return res.status(500).json({ error: 'Error retrieving the friends of this user' });
    }
});

router.get('/search', verify_token, async (req, res) => {
    const query = String(req.query?.q ?? '').trim();

    if (!query) {
        return res.json([]);
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url, users.profession, users.description, users.last_seen
             FROM friend_requests
             JOIN users ON users.id = CASE
                 WHEN friend_requests.sender_id = $1 THEN friend_requests.receiver_id
                 ELSE friend_requests.sender_id
             END
             WHERE friend_requests.status = 'accepted'
               AND (friend_requests.sender_id = $1 OR friend_requests.receiver_id = $1)
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
        console.error('Error while finding friends:', error);
        return res.status(500).json({ error: 'Error searching your friends' });
    }
});

router.get('/:friendId/profile', verify_token, async (req, res) => {
    const friendId = Number.parseInt(req.params.friendId, 10);

    if (!Number.isInteger(friendId)) {
        return res.status(400).json({ error: 'Invalid friend.' });
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.email, users.full_name, users.avatar_url, users.profession, users.description, users.last_seen
             FROM users
             WHERE users.id = $1
               AND (
                 users.id = $2
                 OR EXISTS (
                     SELECT 1
                     FROM friend_requests
                     WHERE friend_requests.status = 'accepted'
                       AND ((friend_requests.sender_id = $2 AND friend_requests.receiver_id = users.id)
                         OR (friend_requests.sender_id = users.id AND friend_requests.receiver_id = $2))
                 )
               )
             LIMIT 1`,
            [friendId, req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error retrieving friend profile:', error);
        return res.status(500).json({ error: 'Error retrieving profile.' });
    }
});

router.get('/requests', verify_token, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT friend_requests.id, users.username, users.email, friend_requests.created_at
             FROM friend_requests
             JOIN users ON users.id = friend_requests.sender_id
             WHERE friend_requests.receiver_id = $1 AND friend_requests.status = 'pending'
             ORDER BY friend_requests.created_at DESC`,
            [req.user.id],
        );
        return res.json(result.rows);
    } catch (error) {
        console.error('Error while retrieving fried requests:', error);
        return res.status(500).json({ error: 'Error retrieving friend request.' });
    }
});

router.post('/heartbeat', verify_token, async (req, res) => {
    try {
        await pool.query(
            `UPDATE users
             SET last_seen = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [req.user.id]
        )

        return res.json({ success: true })
    } catch (error) {
        console.error('Error updating presence:', error)
        return res.status(500).json({
            error: 'Error updating presence.'
        })
    }
})

router.post('/requests', verify_token, async (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    if (!username) return res.status(400).json({ error: 'A nick is mandatory.' });

    try {
        const recipientResult = await pool.query(
            'SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
            [username],
        );
        const recipient = recipientResult.rows[0];
        if (!recipient) return res.status(404).json({ error: 'That user does not exist.' });
        if (recipient.id === req.user.id) return res.status(400).json({ error: 'You can not send a friend request to yourself.' });

        const existing = await pool.query(
            `SELECT id, status FROM friend_requests
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             LIMIT 1`,
            [req.user.id, recipient.id],
        );
        if (existing.rows.length > 0) {
            const request = existing.rows[0];
            if (request.status === 'accepted') return res.status(409).json({ error: 'You are already friends.' });
            if (request.status === 'pending') return res.status(409).json({ error: 'There is already a pending friend request between these users.' });
            await pool.query(
                `UPDATE friend_requests
                 SET sender_id = $1, receiver_id = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [req.user.id, recipient.id, request.id],
            );
            return res.status(201).json({ message: 'Friend request sent.' });
        }

        await pool.query(
            'INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2)',
            [req.user.id, recipient.id],
        );
        return res.status(201).json({ message: 'Friend request sent.' });
    } catch (error) {
        console.error('Error while creating the friend request:', error);
        return res.status(500).json({ error: 'Error sending the fiend request.' });
    }
});

router.patch('/requests/:requestId', verify_token, async (req, res) => {
    const requestId = Number.parseInt(req.params.requestId, 10);
    const action = String(req.body?.status ?? '').trim();
    

    if (!Number.isInteger(requestId)) {
        return res.status(400).json({ error: 'Invalid friend request.' });
    }

if (action !== 'accepted' && action !== 'rejected') {
    return res.status(400).json({
        error: 'Invalid action. Must be accepted o rejected.'
    });
}

    try {
        const requestCheck = await pool.query(
            'SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2 AND status = \'pending\'',
            [requestId, req.user.id]
        );

        if (requestCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Friend request not found or already processed.' });
        }

        await pool.query(
            'UPDATE friend_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [action, requestId]
        );

        return res.json({ message: `Friend request ${action === 'accepted' ? 'accepted' : 'rejected'} successfully.` });
    } catch (error) {
        console.error('Error processing the friend request:', error);
        return res.status(500).json({ error: 'Error processing the friend request.' });
    }
});

router.delete('/:friendId', verify_token, async (req, res) => {
    const friendId = Number.parseInt(req.params.friendId, 10);
    if (!Number.isInteger(friendId)) return res.status(400).json({ error: 'Invalid friend.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `DELETE FROM friend_requests
             WHERE status = 'accepted'
               AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
             RETURNING id`,
            [req.user.id, friendId],
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Friend not found.' });
        }
        await client.query(
            `DELETE FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)`,
            [req.user.id, friendId],
        );
        await client.query('COMMIT');
        return res.status(204).end();
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting friend:', error);
        return res.status(500).json({ error: 'Error deleting friend.' });
    } finally {
        client.release();
    }
});

export default router;
