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

    console.error(err);
    res.status(500).json({ error: true, mensaje: 'Error interno del servidor' });
};
