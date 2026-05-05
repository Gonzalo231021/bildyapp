import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({ error: true, mensaje: err.message });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            error: true,
            mensaje: 'Error de validación',
            detalles: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message }))
        });
    }

    // ID de MongoDB malformado — sin esto devuelve 500 con un stack trace feo
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ error: true, mensaje: 'ID no válido' });
    }

    // Índice único violado (ej: CIF duplicado, projectCode duplicado en misma empresa)
    if (err.code === 11000) {
        const campo = Object.keys(err.keyValue || {}).join(', ');
        return res.status(409).json({ error: true, mensaje: `Valor duplicado en: ${campo}` });
    }

    // Error de validación de Mongoose (campos required, enum, etc.)
    if (err.name === 'ValidationError') {
        const detalles = Object.values(err.errors).map(e => ({ campo: e.path, mensaje: e.message }));
        return res.status(400).json({ error: true, mensaje: 'Error de validación', detalles });
    }

    console.error(err);
    res.status(500).json({ error: true, mensaje: 'Error interno del servidor' });
};
