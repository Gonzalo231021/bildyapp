import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/user.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/user', userRoutes);

app.get('/pruebaDB', (req, res) => {
    res.json({ status: 'ok', mensaje: 'BildiApp y base de datos funcionando' });
});

export default app;