import express from 'express';
import { login, changePassword, getMe, updateNotificationPreference } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.patch('/notifications', authenticate, updateNotificationPreference);

export default router;
