import { Router } from 'express';
import {
    registerCtrl,
    validateEmailCtrl,
    loginCtrl,
    updatePersonalDataCtrl,
    updateCompanyCtrl,
} from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import {
    registerValidator,
    validationCodeValidator,
    personalDataValidator,
    companyDataValidator,
} from '../validators/user.validator.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Endpoint 1: Registro de usuario
router.post('/register', validate(registerValidator), registerCtrl);
// Endpoint 2: Validación de email
router.put('/validation', authMiddleware, validate(validationCodeValidator), validateEmailCtrl);
// Endpoint 3: Login
router.post('/login', validate(registerValidator), loginCtrl);
// Endpoint 4a: Onboarding — datos personales
router.put('/register', authMiddleware, validate(personalDataValidator), updatePersonalDataCtrl);
// Endpoint 4b: Onboarding — datos de compañía
router.patch('/company', authMiddleware, validate(companyDataValidator), updateCompanyCtrl);

export default router;