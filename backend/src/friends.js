import express from 'express';
import { pool } from './db.js';
import { formatErrorJson, isAuthenticated } from './utils.js';
import { verify_token } from './token.js';
import { addNotification } from './notifications.js';

const router = express.Router();

router.use(express.json());


async function read_friends(req, res) {
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
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                `Error retrieving friends: ${error}`
            )
        );
    }
}


async function read_friends_by_user(req, res) {
    const userId = Number.parseInt(req.params.userId, 10);

    if (!Number.isInteger(userId)) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Invalid user")
        );
    }

    try {
        if (userId !== req.user.id) {
            const allowedResult = await pool.query(
                `SELECT 1
                 FROM friend_requests
                 WHERE status = 'accepted'
                   AND ((sender_id = $1 AND receiver_id = $2)
                     OR (sender_id = $2 AND receiver_id = $1))
                 LIMIT 1`,
                [req.user.id, userId],
            );

            if (allowedResult.rows.length === 0) {
                return res.status(403).json(
                    formatErrorJson(
                        403,
                        "Forbidden",
                        'You can not see the friends of this user'
                    )
                );
            }
        }

        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url,
                    users.profession, users.description, users.last_seen
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
            [userId],
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error retrieving the friends of this user:', error);
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                `Error retrieving friends: ${error}`
            )
        );
    }
}


async function read_friends_search(req, res) {
    const query = String(req.query?.q ?? '').trim();

    if (!query) {
        return res.json([]);
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.full_name, users.avatar_url,
                    users.profession, users.description, users.last_seen
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
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                'Error searching your friends'
            )
        );
    }
}


async function read_friend_profile(req, res) {
    const friendId = Number.parseInt(req.params.friendId, 10);

    if (!Number.isInteger(friendId)) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Invalid friend")
        );
    }

    try {
        const result = await pool.query(
            `SELECT users.id, users.username, users.email, users.full_name,
                    users.avatar_url, users.profession, users.description,
                    users.last_seen
             FROM users
             WHERE users.id = $1
               AND (
                 users.id = $2
                 OR EXISTS (
                     SELECT 1
                     FROM friend_requests
                     WHERE friend_requests.status = 'accepted'
                       AND (
                         (friend_requests.sender_id = $2
                          AND friend_requests.receiver_id = users.id)
                         OR
                         (friend_requests.sender_id = users.id
                          AND friend_requests.receiver_id = $2)
                       )
                 )
               )
             LIMIT 1`,
            [friendId, req.user.id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json(
                formatErrorJson(404, "Not Found", 'Profile not found')
            );
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error retrieving friend profile:', error);
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                'Error retrieving profile'
            )
        );
    }
}


async function read_friend_requests(req, res) {
    try {
        const result = await pool.query(
            `SELECT friend_requests.id, users.username, users.email,
                    friend_requests.created_at
             FROM friend_requests
             JOIN users ON users.id = friend_requests.sender_id
             WHERE friend_requests.receiver_id = $1
               AND friend_requests.status = 'pending'
             ORDER BY friend_requests.created_at DESC`,
            [req.user.id],
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error while retrieving friend requests:', error);
        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                'Error retrieving friend request'
            )
        );
    }
}


async function create_heartbeat(req, res) {
    try {
        await pool.query(
            `UPDATE users
             SET last_seen = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [req.user.id]
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('Error updating presence:', error);

        return res.status(500).json({
            error: 'Error updating presence.'
        });
    }
}


async function create_friend_request(req, res) {
    const username = String(req.body?.username ?? '').trim();

    if (!username) {
        return res.status(400).json(
            formatErrorJson(400, "Bad Request", "Nick is mandatory")
        );
    }

    try {
        const recipientResult = await pool.query(
            `SELECT id, username
             FROM users
             WHERE LOWER(username) = LOWER($1)
             LIMIT 1`,
            [username],
        );

        const recipient = recipientResult.rows[0];

        if (!recipient) {
            return res.status(404).json(
                formatErrorJson(
                    404,
                    "Not Found",
                    'That user does not exist'
                )
            );
        }

        if (recipient.id === req.user.id) {
            return res.status(400).json(
                formatErrorJson(
                    400,
                    "Bad Request",
                    "Can't send a friend request to yourself"
                )
            );
        }

        const existing = await pool.query(
            `SELECT id, status
             FROM friend_requests
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             LIMIT 1`,
            [req.user.id, recipient.id],
        );

        if (existing.rows.length > 0) {
            const request = existing.rows[0];

            if (request.status === 'accepted') {
                return res.status(409).json(
                    formatErrorJson(
                        409,
                        "Conflict",
                        'You are already friends'
                    )
                );
            }

            if (request.status === 'pending') {
                return res.status(409).json(
                    formatErrorJson(
                        409,
                        "Conflict",
                        'There is already a pending friend request between these users'
                    )
                );
            }

            await pool.query(
                `UPDATE friend_requests
                 SET sender_id = $1,
                     receiver_id = $2,
                     status = 'pending',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [req.user.id, recipient.id, request.id],
            );

            const senderResult = await pool.query(
                'SELECT username FROM users WHERE id = $1',
                [req.user.id],
            );

            addNotification(recipient.id, {
                type: 'friend_request',
                message: `${senderResult.rows[0].username} te ha enviado una solicitud de amistad`,
            });

            return res.status(201).json({
                message: 'Friend request sent.'
            });
        }

        await pool.query(
            `INSERT INTO friend_requests (sender_id, receiver_id)
             VALUES ($1, $2)`,
            [req.user.id, recipient.id],
        );

        const senderResult = await pool.query(
            'SELECT username FROM users WHERE id = $1',
            [req.user.id],
        );

        addNotification(recipient.id, {
            type: 'friend_request',
            message: `${senderResult.rows[0].username} te ha enviado una solicitud de amistad`,
        });

        return res.status(201).json({
            message: 'Friend request sent.'
        });
    } catch (error) {
        console.error('Error while creating the friend request:', error);

        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                'Error sending the friend request'
            )
        );
    }
}


async function update_friend_request(req, res) {
    const requestId = Number.parseInt(req.params.requestId, 10);
    const action = String(req.body?.status ?? '').trim();

    if (!Number.isInteger(requestId)) {
        return res.status(400).json(
            formatErrorJson(
                400,
                "Bad Request",
                'Invalid friend request.'
            )
        );
    }

    if (action !== 'accepted' && action !== 'rejected') {
        return res.status(400).json({
            error: 'Invalid action. Must be accepted or rejected.'
        });
    }

    try {
        const requestCheck = await pool.query(
            `SELECT friend_requests.*, users.username
             FROM friend_requests
             JOIN users ON users.id = friend_requests.receiver_id
             WHERE friend_requests.id = $1
               AND friend_requests.receiver_id = $2
               AND friend_requests.status = 'pending'`,
            [requestId, req.user.id]
        );

        if (requestCheck.rows.length === 0) {
            return res.status(404).json(
                formatErrorJson(
                    404,
                    "Not Found",
                    'Friend request not found or already processed'
                )
            );
        }

        const request = requestCheck.rows[0];

        await pool.query(
            `UPDATE friend_requests
             SET status = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [action, requestId]
        );

        if (action === 'accepted') {
            addNotification(request.sender_id, {
                type: 'friend_accepted',
                message: `${request.username} ha aceptado tu solicitud de amistad`,
            });
        } else {
            addNotification(request.sender_id, {
                type: 'friend_rejected',
                message: `${request.username} ha rechazado tu solicitud de amistad`,
            });
        }

        return res.json({
            message: `Friend request ${action === 'accepted' ? 'accepted' : 'rejected'} successfully.`
        });
    } catch (error) {
        console.error('Error processing the friend request:', error);

        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                'Error processing the friend request'
            )
        );
    }
}


async function delete_friend(req, res) {
    const friendId = Number.parseInt(req.params.friendId, 10);

    if (!Number.isInteger(friendId)) {
        return res.status(400).json(
            formatErrorJson(
                400,
                "Bad Request",
                'Invalid friend'
            )
        );
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            'SELECT username FROM users WHERE id = $1',
            [req.user.id]
        );

        const username = userResult.rows[0]?.username || 'Un usuario';

        const result = await client.query(
            `DELETE FROM friend_requests
             WHERE status = 'accepted'
               AND (
                 (sender_id = $1 AND receiver_id = $2)
                 OR
                 (sender_id = $2 AND receiver_id = $1)
               )
             RETURNING id`,
            [req.user.id, friendId],
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json(
                formatErrorJson(
                    404,
                    "Not Found",
                    'Friend not found'
                )
            );
        }

        await client.query(
            `DELETE FROM chat_messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)`,
            [req.user.id, friendId],
        );

        await client.query('COMMIT');

        addNotification(friendId, {
            type: 'friend_removed',
            message: `${username} te ha eliminado de sus amigos`,
        });

        return res.status(204).end();
    } catch (error) {
        await client.query('ROLLBACK');

        console.error('Error deleting friend:', error);

        return res.status(500).json(
            formatErrorJson(
                500,
                "Internal Server Error",
                'Error deleting friend'
            )
        );
    } finally {
        client.release();
    }
}


router.get('/', verify_token, read_friends);
router.get('/user/:userId', verify_token, read_friends_by_user);
router.get('/search', verify_token, read_friends_search);
router.get('/:friendId/profile', verify_token, read_friend_profile);
router.get('/requests', verify_token, read_friend_requests);
router.post('/heartbeat', verify_token, create_heartbeat);
router.post('/requests', verify_token, create_friend_request);
router.patch('/requests/:requestId', verify_token, update_friend_request);
router.delete('/:friendId', verify_token, delete_friend);

export default router;