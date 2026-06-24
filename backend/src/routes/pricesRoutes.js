import express from 'express';
import {
  getKapstersForService,
  getPricesByKapster,
  getKapsterServiceCatalog,
  toggleKapsterService,
  updatePrice,
  requestPriceChange,
  approvePriceChange,
  getPendingApprovals,
} from '../controllers/pricesController.js';
import { authenticate, requireRole, STAFF_ROLES } from '../middleware/auth.js';

const router = express.Router();

router.get('/service/:serviceId', getKapstersForService);
router.get('/kapster/:kapsterId', getPricesByKapster);
router.get('/kapster/:kapsterId/catalog', authenticate, requireRole('owner', ...STAFF_ROLES), getKapsterServiceCatalog);
router.post('/kapster/:kapsterId/toggle/:serviceId', authenticate, requireRole(...STAFF_ROLES), toggleKapsterService);
router.put('/:kapsterId/:serviceId', authenticate, requireRole('owner'), updatePrice);
router.post('/:kapsterId/:serviceId/request', authenticate, requireRole(...STAFF_ROLES), requestPriceChange);
router.post('/:kapsterId/:serviceId/approve', authenticate, requireRole('owner'), approvePriceChange);
router.get('/pending', authenticate, requireRole('owner'), getPendingApprovals);

export default router;
