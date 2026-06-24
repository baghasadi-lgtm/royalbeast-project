import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { listUsers, createUser, deleteUser, resetUserPassword } from '../controllers/usersController.js';

const router = express.Router();

router.use(authenticate, requireRole('owner'));

router.get('/', listUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;
