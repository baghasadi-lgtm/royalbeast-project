import express from 'express';
import upload from '../middleware/upload.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getQrisSetting, uploadQrisSetting } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/qris', getQrisSetting);
router.put('/qris', authenticate, requireRole('owner'), upload.single('qris'), uploadQrisSetting);

export default router;
