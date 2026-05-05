import { Server } from 'socket.io';
import { verifyToken } from './handleJwt.js';

let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || '*',
            methods: ['GET', 'POST'],
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('NO_AUTORIZADO'));

        const payload = verifyToken(token);
        if (!payload) return next(new Error('NO_AUTORIZADO'));

        socket.data.user = payload;
        next();
    });

    io.on('connection', (socket) => {
        const company = socket.data.user?.company;
        if (company) {
            socket.join(`room:${company}`);
        }

        socket.on('disconnect', () => {
            if (company) socket.leave(`room:${company}`);
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) throw new Error('Socket.IO no inicializado — llama a initSocket primero');
    return io;
};
