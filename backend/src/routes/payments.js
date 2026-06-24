import express from 'express';
import {
  confirmCashPayment,
  getPaymentStatus,
  handlePaymentWebhook,
  simulateQrisPayment,
} from '../controllers/paymentsController.js';
import { authenticate, requireStaff } from '../middleware/auth.js';

const router = express.Router();

router.get('/status/:id', getPaymentStatus);
router.post('/webhook', handlePaymentWebhook);
router.post('/:id/confirm-cash', authenticate, requireStaff, confirmCashPayment);
router.post('/:id/simulate-qris', simulateQrisPayment);

export default router;
