import express from 'express';
import upload from '../middleware/upload.js';
import { authenticate, requireRole, requireStaff } from '../middleware/auth.js';
import {
  getAllKapsters,
  getKapsterById,
  createKapster,
  updateKapster,
  updateKapsterMeta,
  deleteKapster,
  kapsterAddService,
  getServicesByKapster,
  getKapstersByService,
} from '../controllers/kapstersController.js';

const router = express.Router();

router.get('/', getAllKapsters);
router.get('/by-service/:serviceId', getKapstersByService);
router.get('/:kapsterId/services', getServicesByKapster);
router.post('/:kapsterId/services', authenticate, requireStaff, kapsterAddService);
router.get('/:id', getKapsterById);
router.post('/', authenticate, requireRole('owner'), createKapster);
router.patch('/:id', authenticate, requireRole('owner'), updateKapsterMeta);
router.delete('/:id', authenticate, requireRole('owner'), deleteKapster);
router.put(
  '/:id',
  authenticate,
  requireStaff,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'portfolio', maxCount: 10 },
  ]),
  updateKapster
);

export default router;
