import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    registerCtrl,
    validateEmailCtrl,
    loginCtrl,
    updatePersonalDataCtrl,
    updateCompanyCtrl,
    uploadLogoCtrl,
    getUserCtrl,
    refreshCtrl,
    logoutCtrl,
    deleteUserCtrl,
    changePasswordCtrl,
    inviteUserCtrl,
} from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import {
    registerValidator,
    validationCodeValidator,
    personalDataValidator,
    companyDataValidator,
    refreshTokenValidator,
    changePasswordValidator,
    inviteValidator,
} from '../validators/user.validator.js';
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/role.js';
import upload from '../middleware/upload.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: true, mensaje: 'Demasiados intentos, espera 15 minutos antes de volver a intentarlo' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Endpoint 1: Registro de usuario
router.post('/register', authLimiter, validate(registerValidator), registerCtrl);
// Endpoint 2: Validación de email
router.put('/validation', authMiddleware, validate(validationCodeValidator), validateEmailCtrl);
// Endpoint 3: Login
router.post('/login', authLimiter, validate(registerValidator), loginCtrl);
// Endpoint 4a: Onboarding — datos personales
router.put('/register', authMiddleware, validate(personalDataValidator), updatePersonalDataCtrl);
// Endpoint 4b: Onboarding — datos de compañía
router.patch('/company', authMiddleware, validate(companyDataValidator), updateCompanyCtrl);
// Endpoint 5: Logo de la compañía
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogoCtrl);
// Endpoint 6: Obtener usuario
router.get('/', authMiddleware, getUserCtrl);
// Endpoint 7a: Refresh token
router.post('/refresh', validate(refreshTokenValidator), refreshCtrl);
// Endpoint 7b: Logout
router.post('/logout', authMiddleware, logoutCtrl);
// Endpoint 8: Eliminar usuario
router.delete('/', authMiddleware, deleteUserCtrl);
// Endpoint 9: Cambiar contraseña
router.put('/password', authMiddleware, validate(changePasswordValidator), changePasswordCtrl);
// Endpoint 10: Invitar compañero
router.post('/invite', authMiddleware, checkRole('admin'), validate(inviteValidator), inviteUserCtrl);

export default router;