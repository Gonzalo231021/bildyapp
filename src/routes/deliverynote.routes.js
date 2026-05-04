import { Router } from 'express';
import {
    createDeliveryNoteCtrl,
    getDeliveryNotesCtrl,
    getDeliveryNoteByIdCtrl,
    deleteDeliveryNoteCtrl,
} from '../controllers/deliverynote.controller.js';
import authMiddleware from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createDeliveryNoteValidator } from '../validators/deliverynote.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createDeliveryNoteValidator), createDeliveryNoteCtrl);
router.get('/', getDeliveryNotesCtrl);
router.get('/:id', getDeliveryNoteByIdCtrl);
router.delete('/:id', deleteDeliveryNoteCtrl);

export default router;
