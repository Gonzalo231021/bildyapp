import { verifyToken } from '../utils/handleJwt.js';
import User from '../models/User.js';
import { handleHttpError } from '../utils/handleError.js';

const authMiddleware = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            handleHttpError(res, 'TOKEN_NO_INTRODUCIDO', 401);
        } else {
            const token = req.headers.authorization.split(' ').pop();
            const decoded = verifyToken(token);

            if (!decoded) {
                handleHttpError(res, 'TOKEN_NO_VALIDO', 401);
            } else {
                const user = await User.findById(decoded._id).select('+verificationCode +verificationAttempts');

                if (!user) {
                    handleHttpError(res, 'USUARIO_NO_EXISTE', 404);
                } else {
                    req.user = user;
                    next();
                }
            }
        }
    } catch (error) {
        handleHttpError(res, 'ERROR_AUTENTICACION', 401);
    }
};

export default authMiddleware;
