import express from 'express';
import {
  getCurrentQueue,
  getPublicQueueBoard,
  checkout,
  getAllOrders,
  getActiveOrders,
  updateOrderStatus,
  getOrderHistory,
  trackOrderByQueue,
  getReceiptByQueue,
} from '../controllers/ordersController.js';
import { authenticate, requireRole, requireStaff } from '../middleware/auth.js';

const router = express.Router();

router.get('/queue', getCurrentQueue);
router.get('/queue/board', getPublicQueueBoard);
router.get('/track/:queueNumber', trackOrderByQueue);
router.get('/receipt/:queueNumber', getReceiptByQueue);
router.post('/checkout', checkout);
router.get('/', authenticate, requireRole('owner'), getAllOrders);
router.get('/active', authenticate, requireStaff, getActiveOrders);
router.patch('/:id/status', authenticate, requireStaff, updateOrderStatus);
router.get('/history', authenticate, requireStaff, getOrderHistory);

export default router;