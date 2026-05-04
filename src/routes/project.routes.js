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
import validate from '../middleware/validate.js';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createProjectValidator), createProjectCtrl);
router.put('/:id', validate(updateProjectValidator), updateProjectCtrl);
router.get('/archived', getArchivedProjectsCtrl);
router.get('/', getProjectsCtrl);
router.get('/:id', getProjectByIdCtrl);
router.delete('/:id', deleteProjectCtrl);
router.patch('/:id/restore', restoreProjectCtrl);

export default router;
