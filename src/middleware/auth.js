import { verifyToken} from "../utils/handleJwt.js";
import User from '../models/User.js';
import { handleHttpError} from "../utils/handleError.js";

const authMiddleware = async (req, res, next) => {
    try {
        if(!req.headers.authorization) {
            return handleHttpError(res, 'TOKEN_NO_INTRODUCIDO', 401);
        }
        //Podriamos poner [1] en vez de .pop() porque el formato del token es "Bearer TOKEN", pero con .pop() cogemos el ultimo elemento, que sera mas fiable en caso de haber modificaciones en el formato. 
        const token = req.headers.authorization.split(' ').pop(); 
        const decoded = verifyToken(token);

        if(!decoded) {
            return handleHttpError(res, 'TOKEN_NO_VALIDO', 401);
        }

        const user = await User.findById(decoded._id).select('+verificationCode +verificationAttempts');

        if(!user) {
            return handleHttpError(res, 'USUARIO_NO_EXISTE', 404);
        }

        req.user = user;
        next();

    } catch (error) {
        handleHttpError(res, 'ERROR_AUTENTICACION', 401);
    }
};

export default authMiddleware;