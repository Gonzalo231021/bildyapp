import { Router } from 'express';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/client', clientRoutes);

export default router;
