import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

let mongod;
let token;
let userId;
let companyId;

const JWT_SECRET = 'test_secret_bildyapp';

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    process.env.JWT_SECRET = JWT_SECRET;

    companyId = new mongoose.Types.ObjectId();

    const user = await User.create({
        email: 'test_client@bildyapp.com',
        password: 'hashedpass',
        name: 'Test',
        role: 'admin',
        status: 'verified',
        company: companyId,
    });
    userId = user._id;

    token = jwt.sign({ _id: userId, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await Client.deleteMany({});
});

describe('POST /api/client', () => {
    it('crea un cliente correctamente', async () => {
        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Empresa ABC', cif: 'A11111111', email: 'abc@empresa.com' });

        expect(res.status).toBe(201);
        expect(res.body.client).toBeDefined();
        expect(res.body.client.name).toBe('Empresa ABC');
        expect(res.body.client.company.toString()).toBe(companyId.toString());
    });

    it('rechaza si falta el nombre', async () => {
        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send({ cif: 'A11111111' });

        expect(res.status).toBe(400);
    });

    it('rechaza sin token', async () => {
        const res = await request(app)
            .post('/api/client')
            .send({ name: 'Test', cif: 'A11111111' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/client', () => {
    it('devuelve solo los clientes de la empresa', async () => {
        await Client.create([
            { user: userId, company: companyId, name: 'Cliente 1', cif: 'B11111111' },
            { user: userId, company: companyId, name: 'Cliente 2', cif: 'B22222222' },
        ]);

        const res = await request(app)
            .get('/api/client')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.clients.length).toBeGreaterThanOrEqual(2);
    });
});

describe('GET /api/client/:id', () => {
    it('devuelve un cliente por id', async () => {
        const cliente = await Client.create({ user: userId, company: companyId, name: 'Cliente X', cif: 'C11111111' });

        const res = await request(app)
            .get(`/api/client/${cliente._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.client._id).toBe(cliente._id.toString());
    });

    it('devuelve 404 si no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/client/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/client/:id', () => {
    it('actualiza el nombre de un cliente', async () => {
        const cliente = await Client.create({ user: userId, company: companyId, name: 'Viejo Nombre', cif: 'D11111111' });

        const res = await request(app)
            .put(`/api/client/${cliente._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Nuevo Nombre' });

        expect(res.status).toBe(200);
        expect(res.body.client.name).toBe('Nuevo Nombre');
    });
});

describe('DELETE /api/client/:id', () => {
    it('elimina (soft delete) un cliente', async () => {
        const cliente = await Client.create({ user: userId, company: companyId, name: 'Para Borrar', cif: 'E11111111' });

        const res = await request(app)
            .delete(`/api/client/${cliente._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('hard delete de un cliente', async () => {
        const cliente = await Client.create({ user: userId, company: companyId, name: 'Hard Delete', cif: 'F11111111' });

        const res = await request(app)
            .delete(`/api/client/${cliente._id}?soft=false`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('devuelve 404 al eliminar cliente inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/client/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('GET /api/client con filtro ?name=', () => {
    it('filtra clientes por nombre', async () => {
        await Client.create([
            { user: userId, company: companyId, name: 'Constructora Norte SL', cif: 'G11111111' },
            { user: userId, company: companyId, name: 'Reformas Sur SL', cif: 'H11111111' },
        ]);

        const res = await request(app)
            .get('/api/client?name=norte')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.clients.some(c => c.name.toLowerCase().includes('norte'))).toBe(true);
    });
});

describe('GET /api/client/archived y PATCH restore', () => {
    it('lista clientes archivados', async () => {
        const cliente = await Client.create({ user: userId, company: companyId, name: 'Archivado SA', cif: 'J11111111' });
        await Client.softDeleteById(cliente._id, userId);

        const res = await request(app)
            .get('/api/client/archived')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.clients.length).toBeGreaterThanOrEqual(1);
    });

    it('restaura un cliente archivado', async () => {
        const cliente = await Client.create({ user: userId, company: companyId, name: 'Para Restaurar SL', cif: 'K11111111' });
        await Client.softDeleteById(cliente._id, userId);

        const res = await request(app)
            .patch(`/api/client/${cliente._id}/restore`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });
});

describe('Error 11000 — índice único', () => {
    it('devuelve 409 al crear cliente con CIF duplicado en la misma empresa', async () => {
        await Client.create({ user: userId, company: companyId, name: 'Primero SL', cif: 'Z99999999' });

        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Segundo SL', cif: 'Z99999999' });

        expect(res.status).toBe(409);
    });
});
