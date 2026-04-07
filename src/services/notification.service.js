import { EventEmitter } from 'node:events';

const notificationService = new EventEmitter();

notificationService.on('user:registered', (data) => {
    console.log(`[Notificación] Nuevo usuario registrado: ${data.email}`);
});

notificationService.on('user:verified', (data) => {
    console.log(`[Notificación] Email verificado: ${data.email}`);
});

notificationService.on('user:invited', (data) => {
    console.log(`[Notificación] Usuario invitado: ${data.email}`);
    // TODO: enviar email de bienvenida al invitado
});

notificationService.on('user:deleted', (data) => {
    console.log(`[Notificación] Usuario eliminado: ${data.userId}`);
});

export default notificationService;
