import morganBody from 'morgan-body';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
//import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import { loggerStream } from './utils/handleLogger.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, mensaje: 'Demasiadas peticiones, intenta más tarde' }
}));

app.use(express.json());
//app.use(mongoSanitize());

app.use((req, res, next) => {
    const check = (obj) => {
        if (!obj) return false;
        return JSON.stringify(obj).includes('$');
    };
    if (check(req.body) || check(req.params) || check(req.query)) {
        return res.status(400).json({ error: true, mensaje: 'Caracteres no permitidos' });
    }
    next();
});


morganBody(app, {
    noColors: true,
    stream: loggerStream,
    skip: (req, res) => res.statusCode < 400
});


app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api', router);

app.get('/pruebaDB', (req, res) => {
    res.json({ status: 'ok', mensaje: 'BildiApp y base de datos funcionando' });
});

app.use(errorHandler);

export default app;