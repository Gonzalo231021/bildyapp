import { ZodError } from 'zod';
import { notifySlack } from '../services/slack.service.js';

export const errorHandler = (err, req, res, next) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({ error: true, mensaje: err.message });
    } else if (err instanceof ZodError) {
        res.status(400).json({
            error: true,
            mensaje: 'Error de validación',
            detalles: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message })),
        });
    } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
        res.status(400).json({ error: true, mensaje: 'ID no válido' });
    } else if (err.code === 11000) {
        const campo = Object.keys(err.keyValue || {}).join(', ');
        res.status(409).json({ error: true, mensaje: `Valor duplicado en: ${campo}` });
    } else if (err.name === 'ValidationError') {
        const detalles = Object.values(err.errors).map(e => ({ campo: e.path, mensaje: e.message }));
        res.status(400).json({ error: true, mensaje: 'Error de validación', detalles });
    } else {
        if (process.env.SLACK_WEBHOOK_URL) notifySlack(err, req).catch(() => {});
        console.error(err);
        res.status(500).json({ error: true, mensaje: 'Error interno del servidor' });
    }
};
