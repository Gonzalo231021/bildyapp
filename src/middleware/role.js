import { handleHttpError } from '../utils/handleError.js';

const checkRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        handleHttpError(res, 'NO_TIENES_PERMISOS', 403);
    } else {
        next();
    }
};

export default checkRole;
