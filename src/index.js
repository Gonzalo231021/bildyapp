import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import dbConnect from './config/db.js';
import { initSocket } from './utils/socket.js';

const PORT = process.env.PORT || 3000;

dbConnect();

const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

const shutdown = () => {
    httpServer.close(() => {
        mongoose.disconnect().then(() => process.exit(0));
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
