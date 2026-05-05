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

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Registro de nuevo usuario
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       409:
 *         description: El email ya está registrado
 */
router.post('/register', authLimiter, validate(registerValidator), registerCtrl);

/**
 * @swagger
 * /user/validation:
 *   put:
 *     summary: Verificar email con código de 6 dígitos
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verificado correctamente
 *       400:
 *         description: Código incorrecto o intentos agotados
 */
router.put('/validation', authMiddleware, validate(validationCodeValidator), validateEmailCtrl);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login con email y contraseña
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login correcto, devuelve tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', authLimiter, validate(registerValidator), loginCtrl);

/**
 * @swagger
 * /user/register:
 *   put:
 *     summary: Onboarding — actualizar datos personales
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               nif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Datos actualizados
 */
router.put('/register', authMiddleware, validate(personalDataValidator), updatePersonalDataCtrl);

/**
 * @swagger
 * /user/company:
 *   patch:
 *     summary: Onboarding — asignar empresa o crear nueva
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFreelance:
 *                 type: boolean
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Empresa asignada correctamente
 */
router.patch('/company', authMiddleware, validate(companyDataValidator), updateCompanyCtrl);

/**
 * @swagger
 * /user/logo:
 *   patch:
 *     summary: Subir logo de la empresa
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo subido correctamente
 */
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogoCtrl);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario con empresa populada
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/', authMiddleware, getUserCtrl);

/**
 * @swagger
 * /user/refresh:
 *   post:
 *     summary: Renovar access token con refresh token
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevos tokens generados
 *       401:
 *         description: Refresh token no válido
 */
router.post('/refresh', validate(refreshTokenValidator), refreshCtrl);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Cerrar sesión — invalida el refresh token
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post('/logout', authMiddleware, logoutCtrl);

/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Eliminar cuenta (soft o hard delete)
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Si es true hace soft delete, si no hard delete
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 */
router.delete('/', authMiddleware, deleteUserCtrl);

/**
 * @swagger
 * /user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put('/password', authMiddleware, validate(changePasswordValidator), changePasswordCtrl);

/**
 * @swagger
 * /user/invite:
 *   post:
 *     summary: Invitar a un compañero a la empresa (solo admin)
 *     tags: [Usuario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario invitado creado
 *       403:
 *         description: Solo los admin pueden invitar
 */
router.post('/invite', authMiddleware, checkRole('admin'), validate(inviteValidator), inviteUserCtrl);

export default router;
