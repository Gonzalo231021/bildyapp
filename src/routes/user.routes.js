import { Router } from 'express';
import {
    registerCtrl,
    validateEmailCtrl,
    loginCtrl,
    updatePersonalDataCtrl,
    updateCompanyCtrl,
    uploadLogoCtrl,
    getUserCtrl,
} from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import {
    registerValidator,
    validationCodeValidator,
    personalDataValidator,
    companyDataValidator,
} from '../validators/user.validator.js';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';

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
// Endpoint 5: Logo de la compañía
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogoCtrl);
// Endpoint 6: Obtener usuario
router.get('/', authMiddleware, getUserCtrl);

export default router;