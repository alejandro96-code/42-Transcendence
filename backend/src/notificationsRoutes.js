import express from 'express';
import { verify_token } from './token.js';
import {
    getNotifications,
    watchProfile,
    unwatchProfile,
} from './notifications.js';

const router = express.Router();

router.get('/', verify_token, (req, res) => {
    return res.json(getNotifications(req.user.id));
});

router.post('/watch/:profileUserId', verify_token, (req, res) => {
    const profileUserId = Number(req.params.profileUserId);

    if (!Number.isSafeInteger(profileUserId) || profileUserId <= 0) {
        return res.status(400).json({
            error: 'Invalid profile user ID',
        });
    }

    watchProfile(profileUserId, req.user.id);

    return res.status(204).end();
});

router.delete('/watch/:profileUserId', verify_token, (req, res) => {
    const profileUserId = Number(req.params.profileUserId);

    if (!Number.isSafeInteger(profileUserId) || profileUserId <= 0) {
        return res.status(400).json({
            error: 'Invalid profile user ID',
        });
    }

    unwatchProfile(profileUserId, req.user.id);

    return res.status(204).end();
});

export default router;