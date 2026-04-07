import User from '../models/User.js';
import { encrypt } from '../utils/handlePassword.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import crypto from 'node:crypto';

export const registerCtrl = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Comprobamos si el email ya existe
        const existingUser = await User.findOne({ email, status: 'verified' });
        if (existingUser) {
            return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);
        }

        // Hasheamos la contraseña
        const hashedPassword = await encrypt(password);

        // Generamos el código de verificación de 6 dígitos
        const verificationCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        
        // Creamos el usuario
        const user = await User.create({
            email,
            password: hashedPassword,
            verificationCode,
            verificationAttempts: 3
        });

        // Generamos los tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        res.status(201).json({
            token: accessToken,
            refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                status: user.status,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_REGISTER_USER');
    }
};