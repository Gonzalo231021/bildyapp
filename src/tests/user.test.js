import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { encrypt } from '../utils/handlePassword.js';

let mongod;
const JWT_SECRET = 'test_secret_bildyapp';

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    process.env.JWT_SECRET = JWT_SECRET;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    await Company.deleteMany({});
});

const makeUser = async (overrides = {}) => {
    const companyId = new mongoose.Types.ObjectId();
    const user = await User.create({
        email: `u${Date.now()}${Math.random()}@test.com`,
        password: 'hashedpass',
        role: 'admin',
        status: 'verified',
        company: companyId,
        ...overrides,
    });
    const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return { user, token, companyId };
};

describe('POST /api/user/register', () => {
    it('registra un usuario nuevo', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ email: 'nuevo@test.com', password: 'Password1' });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
    });

    it('rechaza email inválido', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ email: 'noemail', password: 'Password1' });

        expect(res.status).toBe(400);
    });

    it('rechaza contraseña sin mayúscula', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ email: 'test@test.com', password: 'password1' });

        expect(res.status).toBe(400);
    });

    it('rechaza email ya verificado', async () => {
        await User.create({ email: 'existe@test.com', password: 'hash', status: 'verified' });

        const res = await request(app)
            .post('/api/user/register')
            .send({ email: 'existe@test.com', password: 'Password1' });

        expect(res.status).toBe(409);
    });

    it('reenvía código si usuario no verificado existe', async () => {
        await User.create({
            email: 'pending@test.com',
            password: 'hash',
            status: 'pending',
            verificationCode: '111111',
            verificationAttempts: 3,
        });

        const res = await request(app)
            .post('/api/user/register')
            .send({ email: 'pending@test.com', password: 'Password1' });

        expect(res.status).toBe(201);
    });
});

describe('PUT /api/user/validation', () => {
    it('valida el email con código correcto', async () => {
        const user = await User.create({
            email: 'verify@test.com',
            password: 'hash',
            status: 'pending',
            verificationCode: '654321',
            verificationAttempts: 3,
        });
        const token = jwt.sign({ _id: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app)
            .put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: '654321' });

        expect(res.status).toBe(200);
    });

    it('rechaza código incorrecto y decrementa intentos', async () => {
        const user = await User.create({
            email: 'verify2@test.com',
            password: 'hash',
            status: 'pending',
            verificationCode: '999999',
            verificationAttempts: 3,
        });
        const token = jwt.sign({ _id: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app)
            .put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: '000000' });

        expect(res.status).toBe(400);
    });

    it('rechaza si ya está verificado', async () => {
        const { user, token } = await makeUser({ status: 'verified' });

        const res = await request(app)
            .put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: '123456' });

        expect(res.status).toBe(400);
    });

    it('rechaza si intentos agotados', async () => {
        const user = await User.create({
            email: 'nointentos@test.com',
            password: 'hash',
            status: 'pending',
            verificationCode: '123456',
            verificationAttempts: 0,
        });
        const token = jwt.sign({ _id: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app)
            .put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: '123456' });

        expect(res.status).toBe(429);
    });
});

describe('POST /api/user/login', () => {
    it('hace login correctamente', async () => {
        await User.create({
            email: 'login@test.com',
            password: await encrypt('Password1'),
            status: 'verified',
        });

        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'login@test.com', password: 'Password1' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('rechaza contraseña incorrecta', async () => {
        await User.create({
            email: 'login2@test.com',
            password: await encrypt('Password1'),
            status: 'verified',
        });

        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'login2@test.com', password: 'WrongPass1' });

        expect(res.status).toBe(401);
    });

    it('rechaza email inexistente', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'noexiste@test.com', password: 'Password1' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/user', () => {
    it('devuelve el perfil del usuario', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
    });

    it('rechaza sin token', async () => {
        const res = await request(app).get('/api/user');
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/user/register (datos personales)', () => {
    it('actualiza nombre y apellidos', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .put('/api/user/register')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Gonzalo', lastName: 'Martínez', nif: '12345678A' });

        expect(res.status).toBe(200);
        expect(res.body.user.name).toBe('Gonzalo');
    });
});

describe('PATCH /api/user/company', () => {
    it('crea empresa nueva', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .patch('/api/user/company')
            .set('Authorization', `Bearer ${token}`)
            .send({
                isFreelance: false,
                name: 'Mi Empresa SL',
                cif: 'B99999999',
                address: { street: 'Calle Test 1', city: 'Madrid', postal: '28001' },
            });

        expect(res.status).toBe(200);
        expect(res.body.user.company).toBeDefined();
    });

    it('se une a empresa existente por CIF y pasa a guest', async () => {
        await Company.create({
            owner: new mongoose.Types.ObjectId(),
            name: 'Empresa Existente',
            cif: 'B88888888',
            isFreelance: false,
        });

        const { token } = await makeUser();

        const res = await request(app)
            .patch('/api/user/company')
            .set('Authorization', `Bearer ${token}`)
            .send({ isFreelance: false, name: 'Empresa Existente', cif: 'B88888888' });

        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe('guest');
    });

    it('crea empresa freelance con datos del propio usuario', async () => {
        const { token } = await makeUser({ nif: '87654321B', name: 'Autónomo' });

        const res = await request(app)
            .patch('/api/user/company')
            .set('Authorization', `Bearer ${token}`)
            .send({ isFreelance: true });

        expect(res.status).toBe(200);
        expect(res.body.user.company).toBeDefined();
    });

    it('rechaza empresa freelance si el usuario no tiene NIF', async () => {
        const { token } = await makeUser({ nif: undefined });

        const res = await request(app)
            .patch('/api/user/company')
            .set('Authorization', `Bearer ${token}`)
            .send({ isFreelance: true });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/user/refresh', () => {
    it('renueva el access token', async () => {
        const { user } = await makeUser();
        const rt = 'test-refresh-abc';
        await User.findByIdAndUpdate(user._id, { refreshToken: rt });

        const res = await request(app)
            .post('/api/user/refresh')
            .send({ refreshToken: rt });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('rechaza refresh token inválido', async () => {
        const res = await request(app)
            .post('/api/user/refresh')
            .send({ refreshToken: 'invalid-refresh-xyz' });

        expect(res.status).toBe(401);
    });
});

describe('POST /api/user/logout', () => {
    it('cierra sesión correctamente', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .post('/api/user/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });
});

describe('PUT /api/user/password', () => {
    it('cambia la contraseña', async () => {
        const { token } = await makeUser({ password: await encrypt('OldPass1') });

        const res = await request(app)
            .put('/api/user/password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'OldPass1', newPassword: 'NewPass1' });

        expect(res.status).toBe(200);
    });

    it('rechaza contraseña actual incorrecta', async () => {
        const { token } = await makeUser({ password: await encrypt('OldPass1') });

        const res = await request(app)
            .put('/api/user/password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'WrongPass1', newPassword: 'NewPass1' });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/user', () => {
    it('soft delete del usuario', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .delete('/api/user?soft=true')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('hard delete del usuario', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .delete('/api/user')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });
});

describe('POST /api/user/invite', () => {
    it('admin invita a un usuario', async () => {
        const { token } = await makeUser({ role: 'admin' });

        const res = await request(app)
            .post('/api/user/invite')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'invitado@test.com', name: 'Invitado', lastName: 'Test' });

        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe('invitado@test.com');
    });

    it('guest no puede invitar', async () => {
        const { token } = await makeUser({ role: 'guest' });

        const res = await request(app)
            .post('/api/user/invite')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'otro@test.com' });

        expect(res.status).toBe(403);
    });
});
