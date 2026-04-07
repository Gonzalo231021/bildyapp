import { Router } from 'express';
import { registerCtrl } from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { registerValidator } from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(registerValidator), registerCtrl);

export default router;