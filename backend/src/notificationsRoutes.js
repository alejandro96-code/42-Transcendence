import express from 'express';
import { verify_token } from './token.js';
import { getNotifications } from './notifications.js';

const router = express.Router();

router.get('/', verify_token, (req, res) => {
    return res.json(getNotifications(req.user.id));
});

export default router;