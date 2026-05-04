import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { handleHttpError } from '../utils/handleError.js';

export const createDeliveryNoteCtrl = async (req, res) => {
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
        console.error(error);
        handleHttpError(res, 'ERROR_CREAR_ALBARAN');
    }
};

export const getDeliveryNotesCtrl = async (req, res) => {
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
        console.error(error);
        handleHttpError(res, 'ERROR_OBTENER_ALBARANES');
    }
};

export const getDeliveryNoteByIdCtrl = async (req, res) => {
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
        console.error(error);
        handleHttpError(res, 'ERROR_OBTENER_ALBARAN');
    }
};

export const signDeliveryNoteCtrl = async (req, res) => {
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

        const signatureBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const updated = await DeliveryNote.findByIdAndUpdate(
            id,
            { signed: true, signatureUrl: signatureBase64 },
            { new: true }
        );

        res.json({ deliveryNote: updated });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_FIRMAR_ALBARAN');
    }
};

export const deleteDeliveryNoteCtrl = async (req, res) => {
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
        console.error(error);
        handleHttpError(res, 'ERROR_ELIMINAR_ALBARAN');
    }
};
