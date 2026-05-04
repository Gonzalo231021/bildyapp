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

router.post('/', validate(createDeliveryNoteValidator), createDeliveryNoteCtrl);
router.get('/', getDeliveryNotesCtrl);
router.get('/:id', getDeliveryNoteByIdCtrl);
router.patch('/:id/sign', uploadSignature, signDeliveryNoteCtrl);
router.get('/:id/pdf', getDeliveryNotePdfCtrl);
router.delete('/:id', deleteDeliveryNoteCtrl);

export default router;
