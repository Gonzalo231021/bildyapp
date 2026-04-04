import express from 'express';

const app = express();

app.use(express.json());

app.get('/pruebaDB', (req, res) => {
    res.json({ status: 'ok', mensaje: 'BildiApp y base de datos funcionando' });
});

export default app;