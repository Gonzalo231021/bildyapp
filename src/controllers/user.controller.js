import path from 'path';
import User from '../models/User.js';
import Company from '../models/Company.js';
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

// Endpoint 4a: Onboarding — datos personales (PUT /api/user/register)
export const updatePersonalDataCtrl = async (req, res) => {
    try {
        const { name, lastName, nif, address } = req.body;
        const userId = req.user._id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, lastName, nif, ...(address && { address }) },
            { new: true, runValidators: true }
        );

        res.json({ user: updatedUser });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_ACTUALIZAR_DATOS_PERSONALES');
    }
};

// Endpoint 4b: Onboarding — datos de compañía (PATCH /api/user/company)
export const updateCompanyCtrl = async (req, res) => {
    try {
        const { isFreelance, name, cif, address } = req.body;
        const user = req.user;

        // Datos que se usarán para la compañía
        let companyName, companyCif, companyAddress;

        if (isFreelance) {
            // El autónomo usa sus datos personales como empresa
            if (!user.nif) {
                return handleHttpError(res, 'COMPLETA_DATOS_PERSONALES_ANTES', 400);
            }
            companyName    = user.fullName || user.name;
            companyCif     = user.nif;
            companyAddress = user.address;
        } else {
            companyName    = name;
            companyCif     = cif;
            companyAddress = address;
        }

        // ¿Ya existe una empresa con ese CIF?
        const existingCompany = await Company.findOne({ cif: companyCif });

        let company;
        let newRole = user.role; // por defecto no cambia

        if (existingCompany) {
            // El usuario se une a la empresa existente como guest
            company = existingCompany;
            newRole = 'guest';
        } else {
            // Creamos la empresa nueva con el usuario como owner
            company = await Company.create({
                owner:      user._id,
                name:       companyName,
                cif:        companyCif,
                address:    companyAddress,
                isFreelance: isFreelance ?? false,
            });
        }

        // Asignamos la empresa y el rol al usuario
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { company: company._id, role: newRole },
            { new: true }
        ).populate('company');

        res.json({ user: updatedUser });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_ACTUALIZAR_EMPRESA');
    }
};

// Endpoint 5: Logo de la compañía (PATCH /api/user/logo)
export const uploadLogoCtrl = async (req, res) => {
    try {
        const user = req.user;

        if (!user.company) {
            return handleHttpError(res, 'USUARIO_SIN_EMPRESA', 400);
        }

        if (!req.file) {
            return handleHttpError(res, 'NO_SE_HA_ENVIADO_IMAGEN', 400);
        }

        const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const company = await Company.findByIdAndUpdate(
            user.company,
            { logo: logoUrl },
            { new: true }
        );

        res.json({ company });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_SUBIR_LOGO');
    }
};

// Endpoint 6: Obtener usuario (GET /api/user)
export const getUserCtrl = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('company');

        if (!user) {
            return handleHttpError(res, 'USUARIO_NO_ENCONTRADO', 404);
        }

        res.json({ user });

    } catch (error) {
        console.error(error);
        handleHttpError(res, 'ERROR_OBTENER_USUARIO');
    }
};