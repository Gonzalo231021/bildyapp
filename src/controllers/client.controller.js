import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';
import { buildPaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { getIo } from '../utils/socket.js';

export const createClientCtrl = async (req, res) => {
    const { name, cif, email, phone, address } = req.body;
    const user = req.user;

    if (!user.company) throw AppError.badRequest('NECESITAS_EMPRESA_PARA_CREAR_CLIENTES');

    const existing = await Client.findOne({ company: user.company, cif });
    if (existing) throw AppError.conflict('YA_EXISTE_UN_CLIENTE_CON_ESE_CIF');

    const client = await Client.create({
        user: user._id,
        company: user.company,
        name, cif, email, phone, address,
    });

    getIo().to(`room:${user.company}`).emit('client:new', { client });

    res.status(201).json({ client });
};

export const updateClientCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findOne({ _id: id, company: user.company });
    if (!client) throw AppError.notFound('CLIENTE_NO_ENCONTRADO');

    const updated = await Client.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    res.json({ client: updated });
};

export const getClientsCtrl = async (req, res) => {
    const user = req.user;
    const { page, limit, name, search, sort } = req.query;
    const { skip, limit: lim, sort: sortStr, pageNum } = buildPaginationQuery({ page, limit, sort });

    const filter = { company: user.company };
    if (search) {
        filter.$text = { $search: search };
    } else if (name) {
        filter.name = { $regex: name, $options: 'i' };
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter).sort(sortStr).skip(skip).limit(lim);

    res.json({ clients, ...buildPaginationResponse(total, lim, pageNum) });
};

export const getClientByIdCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findOne({ _id: id, company: user.company });
    if (!client) throw AppError.notFound('CLIENTE_NO_ENCONTRADO');

    res.json({ client });
};

export const deleteClientCtrl = async (req, res) => {
    const { id } = req.params;
    const { soft } = req.query;
    const user = req.user;

    const client = await Client.findOne({ _id: id, company: user.company });
    if (!client) throw AppError.notFound('CLIENTE_NO_ENCONTRADO');

    if (soft === 'true') {
        await Client.softDeleteById(id, user._id);
    } else {
        await Client.hardDelete(id);
    }

    res.json({ mensaje: 'Cliente eliminado correctamente' });
};

export const getArchivedClientsCtrl = async (req, res) => {
    const user = req.user;
    const clients = await Client.findDeleted({ company: user.company });
    res.json({ clients });
};

export const restoreClientCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findWithDeleted({ _id: id, company: user.company });
    if (!client.length) throw AppError.notFound('CLIENTE_NO_ENCONTRADO');

    const restored = await Client.restoreById(id);
    res.json({ client: restored });
};
