import User from '../models/User.js';
import Company from '../models/Company.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { generateAccessToken, generateRefreshToken } from '../utils/handleJwt.js';
import AppError from '../utils/AppError.js';
import notificationService from '../services/notification.service.js';

export const registerCtrl = async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.status === 'verified') {
        throw AppError.conflict('CORREO_YA_REGISTRADO');
    }

    const hashedPassword = await encrypt(password);
    const verificationCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    let user;
    if (existingUser) {
        user = await User.findByIdAndUpdate(existingUser._id, {
            verificationCode,
            verificationAttempts: 3,
        }, { new: true });
    } else {
        user = await User.create({
            email,
            password: hashedPassword,
            verificationCode,
            verificationAttempts: 3,
        });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken });

    notificationService.emit('user:registered', { email: user.email });

    res.status(201).json({
        token: accessToken,
        refreshToken,
        user: { _id: user._id, email: user.email, status: user.status, role: user.role },
    });
};

export const validateEmailCtrl = async (req, res) => {
    const { code } = req.body;
    const user = req.user;

    if (user.status === 'verified') throw AppError.badRequest('USUARIO_YA_VERIFICADO');
    if (user.verificationAttempts <= 0) throw new AppError(429, 'INTENTOS_AGOTADOS');

    if (user.verificationCode !== code) {
        user.verificationAttempts -= 1;
        await user.save();
        throw AppError.badRequest('CODIGO_VERIFICACION_INCORRECTO');
    }

    await User.findByIdAndUpdate(user._id, {
        status: 'verified',
        verificationCode: null,
        verificationAttempts: 0,
    });

    notificationService.emit('user:verified', { email: user.email });

    res.json({ mensaje: 'Email verificado correctamente' });
};

export const loginCtrl = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw AppError.unauthorized('CREDENCIALES_INCORRECTAS');

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) throw AppError.unauthorized('CREDENCIALES_INCORRECTAS');

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.json({
        token: accessToken,
        refreshToken,
        user: { _id: user._id, email: user.email, status: user.status, role: user.role },
    });
};

export const updatePersonalDataCtrl = async (req, res) => {
    const { name, lastName, nif, address } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name, lastName, nif, ...(address && { address }) },
        { new: true, runValidators: true }
    );

    res.json({ user: updatedUser });
};

export const updateCompanyCtrl = async (req, res) => {
    const { isFreelance, name, cif, address } = req.body;
    const user = req.user;

    let companyName, companyCif, companyAddress;

    if (isFreelance) {
        if (!user.nif) throw AppError.badRequest('COMPLETA_DATOS_PERSONALES_ANTES');
        companyName = user.fullName || user.name;
        companyCif = user.nif;
        companyAddress = user.address;
    } else {
        companyName = name;
        companyCif = cif;
        companyAddress = address;
    }

    const existingCompany = await Company.findOne({ cif: companyCif });

    let company;
    let newRole = user.role;

    if (existingCompany) {
        company = existingCompany;
        newRole = 'guest';
    } else {
        company = await Company.create({
            owner: user._id,
            name: companyName,
            cif: companyCif,
            address: companyAddress,
            isFreelance: isFreelance ?? false,
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { company: company._id, role: newRole },
        { new: true }
    ).populate('company');

    res.json({ user: updatedUser });
};

export const uploadLogoCtrl = async (req, res) => {
    const user = req.user;

    if (!user.company) throw AppError.badRequest('USUARIO_SIN_EMPRESA');
    if (!req.file) throw AppError.badRequest('NO_SE_HA_ENVIADO_IMAGEN');

    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
        user.company,
        { logo: logoUrl },
        { new: true }
    );

    res.json({ company });
};

export const refreshCtrl = async (req, res) => {
    const { refreshToken } = req.body;

    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user) throw AppError.unauthorized('REFRESH_TOKEN_NO_VALIDO');

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
};

export const logoutCtrl = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ mensaje: 'Sesión cerrada correctamente' });
};

export const deleteUserCtrl = async (req, res) => {
    const { soft } = req.query;
    const userId = req.user._id;

    if (soft === 'true') {
        await User.softDeleteById(userId, userId);
    } else {
        await User.hardDelete(userId);
    }

    notificationService.emit('user:deleted', { userId });

    res.json({ mensaje: 'Usuario eliminado correctamente' });
};

export const changePasswordCtrl = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const passwordMatch = await compare(currentPassword, user.password);
    if (!passwordMatch) throw AppError.unauthorized('CONTRASEÑA_ACTUAL_INCORRECTA');

    const hashedPassword = await encrypt(newPassword);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
};

export const inviteUserCtrl = async (req, res) => {
    const { email, name, lastName } = req.body;
    const inviter = req.user;

    if (!inviter.company) throw AppError.badRequest('NECESITAS_EMPRESA_PARA_INVITAR');

    const tempPassword = await encrypt(`Bildy${Math.random().toString(36).slice(2, 10)}!`);

    const newUser = await User.create({
        email, name, lastName,
        password: tempPassword,
        company: inviter.company,
        role: 'guest',
        status: 'pending',
    });

    notificationService.emit('user:invited', { email, companyId: inviter.company });

    res.status(201).json({ user: newUser });
};

export const getUserCtrl = async (req, res) => {
    const user = await User.findById(req.user._id).populate('company');
    if (!user) throw AppError.notFound('USUARIO_NO_ENCONTRADO');
    res.json({ user });
};
