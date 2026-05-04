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
import validate from '../middleware/validate.js';
import { createClientValidator, updateClientValidator } from '../validators/client.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createClientValidator), createClientCtrl);
router.put('/:id', validate(updateClientValidator), updateClientCtrl);
router.get('/archived', getArchivedClientsCtrl);
router.get('/', getClientsCtrl);
router.get('/:id', getClientByIdCtrl);
router.delete('/:id', deleteClientCtrl);
router.patch('/:id/restore', restoreClientCtrl);

export default router;
