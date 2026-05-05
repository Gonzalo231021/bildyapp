import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';
import { buildPaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { getIo } from '../utils/socket.js';

export const createProjectCtrl = async (req, res) => {
    const { name, projectCode, client, address, email, notes, active } = req.body;
    const user = req.user;

    if (!user.company) throw AppError.badRequest('NECESITAS_EMPRESA_PARA_CREAR_PROYECTOS');

    const clientDoc = await Client.findOne({ _id: client, company: user.company });
    if (!clientDoc) throw AppError.notFound('CLIENTE_NO_ENCONTRADO_O_NO_PERTENECE_A_TU_EMPRESA');

    const existing = await Project.findOne({ company: user.company, projectCode });
    if (existing) throw AppError.conflict('YA_EXISTE_UN_PROYECTO_CON_ESE_CODIGO');

    const project = await Project.create({
        user: user._id,
        company: user.company,
        client, name, projectCode, address, email, notes,
        active: active ?? true,
    });

    getIo().to(`room:${user.company}`).emit('project:new', { project });

    res.status(201).json({ project });
};

export const updateProjectCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const project = await Project.findOne({ _id: id, company: user.company });
    if (!project) throw AppError.notFound('PROYECTO_NO_ENCONTRADO');

    const updated = await Project.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    res.json({ project: updated });
};

export const getProjectsCtrl = async (req, res) => {
    const user = req.user;
    const { page, limit, name, client, active, sort } = req.query;
    const { skip, limit: lim, sort: sortStr, pageNum } = buildPaginationQuery({ page, limit, sort });

    const filter = { company: user.company };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (client) filter.client = client;
    if (active !== undefined) filter.active = active === 'true';

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
        .populate('client', 'name cif')
        .sort(sortStr).skip(skip).limit(lim);

    res.json({ projects, ...buildPaginationResponse(total, lim, pageNum) });
};

export const getProjectByIdCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const project = await Project.findOne({ _id: id, company: user.company })
        .populate('client', 'name cif email');
    if (!project) throw AppError.notFound('PROYECTO_NO_ENCONTRADO');

    res.json({ project });
};

export const deleteProjectCtrl = async (req, res) => {
    const { id } = req.params;
    const { soft } = req.query;
    const user = req.user;

    const project = await Project.findOne({ _id: id, company: user.company });
    if (!project) throw AppError.notFound('PROYECTO_NO_ENCONTRADO');

    if (soft === 'true') {
        await Project.softDeleteById(id, user._id);
    } else {
        await Project.hardDelete(id);
    }

    res.json({ mensaje: 'Proyecto eliminado correctamente' });
};

export const getArchivedProjectsCtrl = async (req, res) => {
    const user = req.user;
    const projects = await Project.findDeleted({ company: user.company });
    res.json({ projects });
};

export const restoreProjectCtrl = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const found = await Project.findWithDeleted({ _id: id, company: user.company });
    if (!found.length) throw AppError.notFound('PROYECTO_NO_ENCONTRADO');

    const restored = await Project.restoreById(id);
    res.json({ project: restored });
};
