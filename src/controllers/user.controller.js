import User from '../models/User.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';

export const registerCtrl = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Comprobamos si el email ya existe
        const existingUser = await User.findOne({ email});
        if (existingUser && existingUser.status === 'verified') {
            return handleHttpError(res, 'CORREO_YA_REGISTRADO', 409);
        }

        // Hasheamos la contraseña
        const hashedPassword = await encrypt(password);

        // Generamos el código de verificación de 6 dígitos (Permitimos códigos con ceros a la izquierda)
        const verificationCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        
        // Si el usuario ya existe pero no está verificado, actualizamos su información
        let user;
        if (existingUser) {
            user =  await User.findByIdAndUpdate(existingUser._id, {
                verificationCode,
                verificationAttempts: 3,
            }, { new: true });
        }else {
            // Creamos el nuevo usuario
            user = await User.create({
                email,
                password: hashedPassword,
                verificationCode,
                verificationAttempts: 3
            });
        }

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
        handleHttpError(res, 'ERROR_REGISTRO_USUARIO');
    }
};


export const validateEmailCtrl = async (req, res) => {
    try {
        const { code} = req.body;
        const user = req.user;

        if(user.status == 'verified') {
            return handleHttpError(res, 'USUARIO_YA_VERIFICADO', 400);
        }

        if (user.verificationAttempts <= 0) {
            return handleHttpError(res, 'INTENTOS_AGOTADOS', 429);
        }
        if (user.verificationCode !== code) {
            user.verificationAttempts -= 1;
            await user.save();
            return handleHttpError(res, 'CODIGO_VERIFICACION_INCORRECTO', 400);
        }

        await User.findByIdAndUpdate(user._id, {
            status: 'verified',
            verificationCode: null,
            verificationAttempts: 0
        });

        res.json({ mensaje: 'Email verificado correctamente' });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_VALIDACION_EMAIL');
    }
};

export const loginCtrl = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return handleHttpError(res, 'CREDENCIALES_INCORRECTAS', 401);
        }

        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) {
            return handleHttpError(res, 'CREDENCIALES_INCORRECTAS', 401);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        res.json({
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
        handleHttpError(res, 'ERROR_LOGIN');
    }
};