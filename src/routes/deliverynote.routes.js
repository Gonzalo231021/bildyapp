import { Router } from 'express';
import {
    createDeliveryNoteCtrl,
    getDeliveryNotesCtrl,
    getDeliveryNoteByIdCtrl,
    signDeliveryNoteCtrl,
    getDeliveryNotePdfCtrl,
    deleteDeliveryNoteCtrl,
} from '../controllers/deliverynote.controller.js';
import authMiddleware from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createDeliveryNoteValidator } from '../validators/deliverynote.validator.js';
import { uploadSignature } from '../utils/multer.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /deliverynote:
 *   post:
 *     summary: Crear un nuevo albarán
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client, project, format]
 *             properties:
 *               client:
 *                 type: string
 *               project:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [material, hours]
 *               material:
 *                 type: string
 *               hours:
 *                 type: number
 *               description:
 *                 type: string
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     hours:
 *                       type: number
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.post('/', validate(createDeliveryNoteValidator), createDeliveryNoteCtrl);

/**
 * @openapi
 * /deliverynote:
 *   get:
 *     summary: Obtener lista de albaranes de la empresa
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *     responses:
 *       200:
 *         description: Lista de albaranes
 */
router.get('/', getDeliveryNotesCtrl);

/**
 * @openapi
 * /deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/:id', getDeliveryNoteByIdCtrl);

/**
 * @openapi
 * /deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán (subir imagen de firma)
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente
 *       400:
 *         description: Ya firmado o falta imagen
 */
router.patch('/:id/sign', uploadSignature, signDeliveryNoteCtrl);

/**
 * @openapi
 * /deliverynote/{id}/pdf:
 *   get:
 *     summary: Descargar el PDF del albarán
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/pdf', getDeliveryNotePdfCtrl);

/**
 * @openapi
 * /deliverynote/{id}:
 *   delete:
 *     summary: Eliminar un albarán (solo si no está firmado)
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eliminado correctamente
 *       400:
 *         description: No se puede eliminar un albarán firmado
 */
router.delete('/:id', deleteDeliveryNoteCtrl);

export default router;
