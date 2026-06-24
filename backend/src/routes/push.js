import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getPublicKey, subscribe, unsubscribe, testPush } from '../controllers/pushController.js';

const router = express.Router();

router.get('/vapid-public-key', getPublicKey);
router.post('/subscribe', authenticate, requireRole('owner', 'staff'), subscribe);
router.post('/unsubscribe', authenticate, requireRole('owner', 'staff'), unsubscribe);
router.post('/test', authenticate, requireRole('owner', 'staff'), testPush);

export default router;
