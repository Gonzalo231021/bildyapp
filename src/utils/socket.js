import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || '*',
            methods: ['GET', 'POST'],
        },
    });
    return io;
};

export const getIo = () => {
    if (!io) throw new Error('Socket.IO no inicializado — llama a initSocket primero');
    return io;
};
