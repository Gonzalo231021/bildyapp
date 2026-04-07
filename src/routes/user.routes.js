import { Router } from 'express';
import { registerCtrl } from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { registerValidator } from '../validators/user.validator.js';

import authMiddleware from '../middleware/auth.js';
import { validateEmailCtrl } from '../controllers/user.controller.js';
import { validationCodeValidator } from '../validators/user.validator.js';

const router = Router();

//Endpoint 1: Registro de usuario
router.post('/register', validate(registerValidator), registerCtrl);
//Endpoint 2: Validación de email
router.put('/validation', authMiddleware, validate(validationCodeValidator), validateEmailCtrl);

export default router;