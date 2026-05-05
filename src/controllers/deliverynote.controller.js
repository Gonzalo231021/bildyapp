import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import { generateDeliveryNotePdf } from '../utils/pdf.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { optimizeImage } from '../utils/imageOptimizer.js';
import { getIo } from '../utils/socket.js';

export const createDeliveryNoteCtrl = async (req, res) => {
    const user = req.user;

    if (!user.company) throw AppError.badRequest('NECESITAS_EMPRESA_PARA_CREAR_ALBARANES');

    const { client, project, format, material, hours, description, workdate, workers } = req.body;

    const clientDoc = await Client.findOne({ _id: client, company: user.company });
    if (!clientDoc) throw AppError.notFound('CLIENTE_NO_ENCONTRADO_O_NO_PERTENECE_A_TU_EMPRESA');

    const projectDoc = await Project.findOne({ _id: project, company: user.company });
    if (!projectDoc) throw AppError.notFound('PROYECTO_NO_ENCONTRADO_O_NO_PERTENECE_A_TU_EMPRESA');

    const deliveryNote = await DeliveryNote.create({
        user: user._id, company: user.company,
        client, project, format, material, hours, description, workdate, workers,
    });

    getIo().to(`room:${user.company}`).emit('deliverynote:new', { deliveryNote });

    res.status(201).json({ deliveryNote });
};

export const getDeliveryNotesCtrl = async (req, res) => {
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
};

export const getDeliveryNoteByIdCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company })
        .populate('client', 'name cif email')
        .populate('project', 'name projectCode address');

    if (!deliveryNote) throw AppError.notFound('ALBARAN_NO_ENCONTRADO');

    res.json({ deliveryNote });
};

export const signDeliveryNoteCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company });
    if (!deliveryNote) throw AppError.notFound('ALBARAN_NO_ENCONTRADO');
    if (deliveryNote.signed) throw AppError.badRequest('EL_ALBARAN_YA_ESTA_FIRMADO');
    if (!req.file) throw AppError.badRequest('SE_REQUIERE_IMAGEN_DE_FIRMA');

    const { buffer: optimizedBuffer, mimetype } = await optimizeImage(req.file.buffer);
    const signatureUrl = await uploadToCloudinary(optimizedBuffer, mimetype);

    const updated = await DeliveryNote.findByIdAndUpdate(
        id,
        { signed: true, signatureUrl },
        { new: true }
    );

    getIo().to(`room:${user.company}`).emit('deliverynote:signed', { deliveryNote: updated });

    res.json({ deliveryNote: updated });
};

export const getDeliveryNotePdfCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company })
        .populate('client', 'name cif email')
        .populate('project', 'name projectCode');

    if (!deliveryNote) throw AppError.notFound('ALBARAN_NO_ENCONTRADO');

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
};

export const deleteDeliveryNoteCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: id, company: user.company });
    if (!deliveryNote) throw AppError.notFound('ALBARAN_NO_ENCONTRADO');
    if (deliveryNote.signed) throw AppError.badRequest('NO_SE_PUEDE_ELIMINAR_UN_ALBARAN_FIRMADO');

    await DeliveryNote.hardDelete(id);

    res.json({ mensaje: 'Albarán eliminado correctamente' });
};
