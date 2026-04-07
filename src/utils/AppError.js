class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }

    static badRequest(message) {
        return new AppError(400, message);
    }

    static unauthorized(message = 'No autorizado') {
        return new AppError(401, message);
    }

    static forbidden(message = 'No tienes permisos') {
        return new AppError(403, message);
    }

    static notFound(message = 'Recurso no encontrado') {
        return new AppError(404, message);
    }

    static conflict(message) {
        return new AppError(409, message);
    }
}

export default AppError;
