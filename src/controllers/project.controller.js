import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { handleHttpError } from '../utils/handleError.js';
import { buildPaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { getIo } from '../utils/socket.js';

export const createProjectCtrl = async (req, res, next) => {
    try {
        const { name, projectCode, client, address, email, notes, active } = req.body;
        const user = req.user;

        if (!user.company) {
            return handleHttpError(res, 'NECESITAS_EMPRESA_PARA_CREAR_PROYECTOS', 400);
        }

        const clientDoc = await Client.findOne({ _id: client, company: user.company });
        if (!clientDoc) {
            return handleHttpError(res, 'CLIENTE_NO_ENCONTRADO_O_NO_PERTENECE_A_TU_EMPRESA', 404);
        }

        const existing = await Project.findOne({ company: user.company, projectCode });
        if (existing) {
            return handleHttpError(res, 'YA_EXISTE_UN_PROYECTO_CON_ESE_CODIGO', 409);
        }

        const project = await Project.create({
            user: user._id,
            company: user.company,
            client,
            name,
            projectCode,
            address,
            email,
            notes,
            active: active ?? true,
        });

        getIo().to(`room:${user.company}`).emit('project:new', { project });

        res.status(201).json({ project });

    } catch (error) {
        next(error);
    }
};

export const updateProjectCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const project = await Project.findOne({ _id: id, company: user.company });
        if (!project) {
            return handleHttpError(res, 'PROYECTO_NO_ENCONTRADO', 404);
        }

        const updated = await Project.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        res.json({ project: updated });

    } catch (error) {
        next(error);
    }
};

export const getProjectsCtrl = async (req, res, next) => {
    try {
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
            .sort(sortStr)
            .skip(skip)
            .limit(lim);

        res.json({
            projects,
            ...buildPaginationResponse(total, lim, pageNum),
        });

    } catch (error) {
        next(error);
    }
};

export const getProjectByIdCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const project = await Project.findOne({ _id: id, company: user.company })
            .populate('client', 'name cif email');
        if (!project) {
            return handleHttpError(res, 'PROYECTO_NO_ENCONTRADO', 404);
        }

        res.json({ project });

    } catch (error) {
        next(error);
    }
};

export const deleteProjectCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { soft } = req.query;
        const user = req.user;

        const project = await Project.findOne({ _id: id, company: user.company });
        if (!project) {
            return handleHttpError(res, 'PROYECTO_NO_ENCONTRADO', 404);
        }

        if (soft === 'true') {
            await Project.softDeleteById(id, user._id);
        } else {
            await Project.hardDelete(id);
        }

        res.json({ mensaje: 'Proyecto eliminado correctamente' });

    } catch (error) {
        next(error);
    }
};

export const getArchivedProjectsCtrl = async (req, res, next) => {
    try {
        const user = req.user;
        const projects = await Project.findDeleted({ company: user.company });
        res.json({ projects });
    } catch (error) {
        next(error);
    }
};

export const restoreProjectCtrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const found = await Project.findWithDeleted({ _id: id, company: user.company });
        if (!found.length) {
            return handleHttpError(res, 'PROYECTO_NO_ENCONTRADO', 404);
        }

        const restored = await Project.restoreById(id);
        res.json({ project: restored });

    } catch (error) {
        next(error);
    }
};
