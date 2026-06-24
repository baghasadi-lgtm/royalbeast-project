import express from 'express';
import {
  getActiveOrders,
  updateOrderStatus
} from '../controllers/kapsterOrdersController.js';

const router = express.Router();

// Kapster
router.get('/active', getActiveOrders);
router.patch('/:id/status', updateOrderStatus);

export default router;
