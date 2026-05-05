import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { handleHttpError } from '../utils/handleError.js';
import { generateDeliveryNotePdf } from '../utils/pdf.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const createDeliveryNoteCtrl = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user.company) {
            return handleHttpError(res, 'NECESITAS_EMPRESA_PARA_CREAR_ALBARANES', 400);
        }

        const { client, project, format, material, hours, description, workdate, workers } = req.body;

        const clientDoc = await Client.findOne({ _id: client, company: user.company });
        if (!clientDoc) {
            return handleHttpError(res, 'CLIENTE_NO_ENCONTRADO_O_NO_PERTENECE_A_TU_EMPRESA', 404);
        }

        const projectDoc = await Project.findOne({ _id: project, company: user.company });
        if (!projectDoc) {
            return handleHttpError(res, 'PROYECTO_NO_ENCONTRADO_O_NO_PERTENECE_A_TU_EMPRESA', 404);
        }

        const deliveryNote = await DeliveryNote.create({
            user: user._id,
            company: user.company,
            client,
            project,
            format,
            material,
            hours,
            description,
            workdate,
            workers,
        });

        res.status(201).json({ deliveryNote });

    } catch (error) {
        next(error);
    }
};

export const getDeliveryNotesCtrl = async (req, res, next) => {
    try {
        const user = req.user;
        const { project, client, format } = req.query;

        const filter = { company: user.company };
        if (project) filter.project = project;
        if (client) filter.client = client;
        if (format) filter.format = format;

        const deliveryNotes = await DeliveryNote.find(filter)
            .populate('client', 'name cif')
            .populate('project', 'name projectCode')
            .sort('-createdAt');

        res.json({ deliveryNotes });

    } catch (error) {
        next(error);
    }
};

export const getDeliveryNoteByIdCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company })
            .populate('client', 'name cif email')
            .populate('project', 'name projectCode address');

        if (!deliveryNote) {
            return handleHttpError(res, 'ALBARAN_NO_ENCONTRADO', 404);
        }

        res.json({ deliveryNote });

    } catch (error) {
        next(error);
    }
};

export const signDeliveryNoteCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company });
        if (!deliveryNote) {
            return handleHttpError(res, 'ALBARAN_NO_ENCONTRADO', 404);
        }

        if (deliveryNote.signed) {
            return handleHttpError(res, 'EL_ALBARAN_YA_ESTA_FIRMADO', 400);
        }

        if (!req.file) {
            return handleHttpError(res, 'SE_REQUIERE_IMAGEN_DE_FIRMA', 400);
        }

        const signatureUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

        const updated = await DeliveryNote.findByIdAndUpdate(
            id,
            { signed: true, signatureUrl },
            { new: true }
        );

        res.json({ deliveryNote: updated });

    } catch (error) {
        next(error);
    }
};

export const getDeliveryNotePdfCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company })
            .populate('client', 'name cif email')
            .populate('project', 'name projectCode');

        if (!deliveryNote) {
            return handleHttpError(res, 'ALBARAN_NO_ENCONTRADO', 404);
        }

        const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

        if (!deliveryNote.pdfUrl) {
            await DeliveryNote.findByIdAndUpdate(id, { pdfUrl: `pdf_${id}` });
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="albaran-${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);

    } catch (error) {
        next(error);
    }
};

export const deleteDeliveryNoteCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company });
        if (!deliveryNote) {
            return handleHttpError(res, 'ALBARAN_NO_ENCONTRADO', 404);
        }

        if (deliveryNote.signed) {
            return handleHttpError(res, 'NO_SE_PUEDE_ELIMINAR_UN_ALBARAN_FIRMADO', 400);
        }

        await DeliveryNote.hardDelete(id);

        res.json({ mensaje: 'Albarán eliminado correctamente' });

    } catch (error) {
        next(error);
    }
};
