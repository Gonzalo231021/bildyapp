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
import checkRole from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { createDeliveryNoteValidator } from '../validators/deliverynote.validator.js';
import { uploadSignature } from '../utils/multer.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /deliverynote:
 *   post:
 *     summary: Crear un nuevo albarán (material u horas)
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNoteInput'
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Cliente o proyecto no encontrado
 */
router.post('/', validate(createDeliveryNoteValidator), createDeliveryNoteCtrl);

/**
 * @swagger
 * /deliverynote:
 *   get:
 *     summary: Listar albaranes de la empresa con filtros
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filtrar por ID de proyecto
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *     responses:
 *       200:
 *         description: Lista de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNotes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryNote'
 */
router.get('/', getDeliveryNotesCtrl);

/**
 * @swagger
 * /deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID con cliente y proyecto populados
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
 *         description: Datos completos del albarán
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id', getDeliveryNoteByIdCtrl);

/**
 * @swagger
 * /deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar albarán — subir imagen de firma (se sube a Cloudinary)
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
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen PNG/JPG de la firma
 *     responses:
 *       200:
 *         description: Albarán firmado, signatureUrl con URL de Cloudinary
 *       400:
 *         description: Ya estaba firmado o falta la imagen
 *       404:
 *         description: Albarán no encontrado
 */
router.patch('/:id/sign', uploadSignature, signDeliveryNoteCtrl);

/**
 * @swagger
 * /deliverynote/{id}/pdf:
 *   get:
 *     summary: Descargar el PDF generado del albarán
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
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id/pdf', getDeliveryNotePdfCtrl);

/**
 * @swagger
 * /deliverynote/{id}:
 *   delete:
 *     summary: Eliminar albarán (solo si no está firmado, solo admin)
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
 *         description: Albarán eliminado correctamente
 *       400:
 *         description: No se puede eliminar un albarán firmado
 *       403:
 *         description: Solo los admin pueden eliminar albaranes
 *       404:
 *         description: Albarán no encontrado
 */
router.delete('/:id', checkRole('admin'), deleteDeliveryNoteCtrl);

export default router;
