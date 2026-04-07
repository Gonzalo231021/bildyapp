import { handleHttpError } from '../utils/handleError.js';

const checkRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return handleHttpError(res, 'NO_TIENES_PERMISOS', 403);
    }
    next();
};

export default checkRole;
