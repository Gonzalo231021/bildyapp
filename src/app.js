import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet());
app.use(mongoSanitize());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, mensaje: 'Demasiadas peticiones, intenta más tarde' }
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/user', userRoutes);

app.get('/pruebaDB', (req, res) => {
    res.json({ status: 'ok', mensaje: 'BildiApp y base de datos funcionando' });
});

app.use(errorHandler);

export default app;