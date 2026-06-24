import express from 'express';
import {
  getOwnerDashboard,
  getKapsterDashboard,
  getCashTransactions,
  createCashTransaction,
  getDiscounts,
  createDiscount,
  deleteDiscount,
} from '../controllers/dashboardController.js';
import { authenticate, requireRole, STAFF_ROLES } from '../middleware/auth.js';

const router = express.Router();

router.get('/owner', authenticate, requireRole('owner'), getOwnerDashboard);
router.get('/kapster', authenticate, requireRole('owner', ...STAFF_ROLES), getKapsterDashboard);
router.get('/cash', authenticate, requireRole('owner'), getCashTransactions);
router.post('/cash', authenticate, requireRole('owner'), createCashTransaction);
router.get('/discounts', getDiscounts);
router.post('/discounts', authenticate, requireRole('owner'), createDiscount);
router.delete('/discounts/:id', authenticate, requireRole('owner'), deleteDiscount);

export default router;
