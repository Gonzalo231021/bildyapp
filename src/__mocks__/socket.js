// stub para Jest — evita el error de Socket.IO no inicializado en tests
const noop = () => ({ emit: () => {}, to: () => ({ emit: () => {} }) });
export const getIo = () => ({ to: () => ({ emit: () => {} }) });
export const initSocket = noop;
