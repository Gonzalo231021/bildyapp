import express from 'express';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(express.json());

app.use('/api/user', userRoutes);

app.get('/pruebaDB', (req, res) => {
    res.json({ status: 'ok', mensaje: 'BildiApp y base de datos funcionando' });
});

export default app;