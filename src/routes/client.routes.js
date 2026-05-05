import { Router } from 'express';
import {
    createClientCtrl,
    updateClientCtrl,
    getClientsCtrl,
    getClientByIdCtrl,
    deleteClientCtrl,
    getArchivedClientsCtrl,
    restoreClientCtrl,
} from '../controllers/client.controller.js';
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { createClientValidator, updateClientValidator } from '../validators/client.validator.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /client:
 *   post:
 *     summary: Crear nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       409:
 *         description: Ya existe un cliente con ese CIF en esta empresa
 */
router.post('/', validate(createClientValidator), createClientCtrl);

/**
 * @swagger
 * /client/{id}:
 *   put:
 *     summary: Actualizar datos de un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', validate(updateClientValidator), updateClientCtrl);

/**
 * @swagger
 * /client/archived:
 *   get:
 *     summary: Listar clientes archivados (soft deleted)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 */
router.get('/archived', getArchivedClientsCtrl);

/**
 * @swagger
 * /client:
 *   get:
 *     summary: Listar clientes con paginación y filtros
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o email (full-text)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtro por nombre (regex, alternativo a search)
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', getClientsCtrl);

/**
 * @swagger
 * /client/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
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
 *         description: Datos del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', getClientByIdCtrl);

/**
 * @swagger
 * /client/{id}:
 *   delete:
 *     summary: Eliminar cliente (solo admin)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: true para soft delete, omitir para hard delete
 *     responses:
 *       200:
 *         description: Cliente eliminado correctamente
 *       403:
 *         description: Solo los admin pueden eliminar clientes
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', checkRole('admin'), deleteClientCtrl);

/**
 * @swagger
 * /client/{id}/restore:
 *   patch:
 *     summary: Restaurar cliente archivado (solo admin)
 *     tags: [Clientes]
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
 *         description: Cliente restaurado
 *       403:
 *         description: Solo los admin pueden restaurar
 *       404:
 *         description: Cliente no encontrado
 */
router.patch('/:id/restore', checkRole('admin'), restoreClientCtrl);

export default router;
