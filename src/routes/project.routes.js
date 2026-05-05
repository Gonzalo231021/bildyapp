import { Router } from 'express';
import {
    createProjectCtrl,
    updateProjectCtrl,
    getProjectsCtrl,
    getProjectByIdCtrl,
    deleteProjectCtrl,
    getArchivedProjectsCtrl,
    restoreProjectCtrl,
} from '../controllers/project.controller.js';
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validator.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /project:
 *   post:
 *     summary: Crear nuevo proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Cliente no encontrado o no pertenece a tu empresa
 *       409:
 *         description: Ya existe un proyecto con ese código en esta empresa
 */
router.post('/', validate(createProjectValidator), createProjectCtrl);

/**
 * @swagger
 * /project/{id}:
 *   put:
 *     summary: Actualizar datos de un proyecto
 *     tags: [Proyectos]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.put('/:id', validate(updateProjectValidator), updateProjectCtrl);

/**
 * @swagger
 * /project/archived:
 *   get:
 *     summary: Listar proyectos archivados (soft deleted)
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 */
router.get('/archived', getArchivedProjectsCtrl);

/**
 * @swagger
 * /project:
 *   get:
 *     summary: Listar proyectos con paginación y filtros
 *     tags: [Proyectos]
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
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtro por nombre (regex)
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filtro por ID de cliente
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtro por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/', getProjectsCtrl);

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Obtener un proyecto por ID
 *     tags: [Proyectos]
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
 *         description: Datos del proyecto con cliente populado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id', getProjectByIdCtrl);

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: Eliminar proyecto (solo admin)
 *     tags: [Proyectos]
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
 *     responses:
 *       200:
 *         description: Proyecto eliminado correctamente
 *       403:
 *         description: Solo los admin pueden eliminar
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete('/:id', checkRole('admin'), deleteProjectCtrl);

/**
 * @swagger
 * /project/{id}/restore:
 *   patch:
 *     summary: Restaurar proyecto archivado (solo admin)
 *     tags: [Proyectos]
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
 *         description: Proyecto restaurado
 *       403:
 *         description: Solo los admin pueden restaurar
 *       404:
 *         description: Proyecto no encontrado
 */
router.patch('/:id/restore', checkRole('admin'), restoreProjectCtrl);

export default router;
