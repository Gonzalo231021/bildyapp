import Client from '../models/Client.js';
import { handleHttpError } from '../utils/handleError.js';
import { buildPaginationQuery, buildPaginationResponse } from '../utils/pagination.js';

export const createClientCtrl = async (req, res) => {
    try {
        const { name, cif, email, phone, address } = req.body;
        const user = req.user;

        if (!user.company) {
            return handleHttpError(res, 'NECESITAS_EMPRESA_PARA_CREAR_CLIENTES', 400);
        }

        const existing = await Client.findOne({ company: user.company, cif });
        if (existing) {
            return handleHttpError(res, 'YA_EXISTE_UN_CLIENTE_CON_ESE_CIF', 409);
        }

        const client = await Client.create({
            user: user._id,
            company: user.company,
            name,
            cif,
            email,
            phone,
            address,
        });

        res.status(201).json({ client });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_CREAR_CLIENTE');
    }
};

export const updateClientCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const client = await Client.findOne({ _id: id, company: user.company });
        if (!client) {
            return handleHttpError(res, 'CLIENTE_NO_ENCONTRADO', 404);
        }

        const updated = await Client.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        res.json({ client: updated });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_ACTUALIZAR_CLIENTE');
    }
};

export const getClientsCtrl = async (req, res) => {
    try {
        const user = req.user;
        const { page, limit, name, sort } = req.query;
        const { skip, limit: lim, sort: sortStr, pageNum } = buildPaginationQuery({ page, limit, sort });

        const filter = { company: user.company };
        if (name) filter.name = { $regex: name, $options: 'i' };

        const total = await Client.countDocuments(filter);

        const clients = await Client.find(filter)
            .sort(sortStr)
            .skip(skip)
            .limit(lim);

        res.json({
            clients,
            ...buildPaginationResponse(total, lim, pageNum),
        });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_OBTENER_CLIENTES');
    }
};

export const getClientByIdCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const client = await Client.findOne({ _id: id, company: user.company });
        if (!client) {
            return handleHttpError(res, 'CLIENTE_NO_ENCONTRADO', 404);
        }

        res.json({ client });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_OBTENER_CLIENTE');
    }
};

export const deleteClientCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { soft } = req.query;
        const user = req.user;

        const client = await Client.findOne({ _id: id, company: user.company });
        if (!client) {
            return handleHttpError(res, 'CLIENTE_NO_ENCONTRADO', 404);
        }

        if (soft === 'true') {
            await Client.softDeleteById(id, user._id);
        } else {
            await Client.hardDelete(id);
        }

        res.json({ mensaje: 'Cliente eliminado correctamente' });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_ELIMINAR_CLIENTE');
    }
};

export const getArchivedClientsCtrl = async (req, res) => {
    try {
        const user = req.user;

        const clients = await Client.findDeleted({ company: user.company });

        res.json({ clients });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_OBTENER_CLIENTES_ARCHIVADOS');
    }
};

export const restoreClientCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const client = await Client.findWithDeleted({ _id: id, company: user.company });
        if (!client.length) {
            return handleHttpError(res, 'CLIENTE_NO_ENCONTRADO', 404);
        }

        const restored = await Client.restoreById(id);

        res.json({ client: restored });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_RESTAURAR_CLIENTE');
    }
};
