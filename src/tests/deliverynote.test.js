import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import DeliveryNote from '../models/DeliveryNote.js';

let mongod;
let token;
let userId;
let companyId;
let clientId;
let projectId;

const JWT_SECRET = 'test_secret_bildyapp';

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    process.env.JWT_SECRET = JWT_SECRET;

    companyId = new mongoose.Types.ObjectId();

    const user = await User.create({
        email: 'test@bildyapp.com',
        password: 'hashedpass',
        name: 'Test',
        role: 'admin',
        status: 'verified',
        company: companyId,
    });
    userId = user._id;

    token = jwt.sign({ _id: userId, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

    const client = await Client.create({
        user: userId,
        company: companyId,
        name: 'Cliente Test',
        cif: 'B12345678',
        email: 'cliente@test.com',
    });
    clientId = client._id;

    const project = await Project.create({
        user: userId,
        company: companyId,
        client: clientId,
        name: 'Proyecto Test',
        projectCode: 'PROJ-001',
    });
    projectId = project._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await DeliveryNote.deleteMany({});
});

describe('POST /api/deliverynote', () => {
    it('crea un albarán de horas correctamente', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({
                client: clientId.toString(),
                project: projectId.toString(),
                format: 'hours',
                hours: 8,
                description: 'Jornada completa en obra',
                workers: [{ name: 'Pepe', hours: 8 }],
            });

        expect(res.status).toBe(201);
        expect(res.body.deliveryNote).toBeDefined();
        expect(res.body.deliveryNote.format).toBe('hours');
        expect(res.body.deliveryNote.signed).toBe(false);
    });

    it('crea un albarán de material correctamente', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({
                client: clientId.toString(),
                project: projectId.toString(),
                format: 'material',
                material: 'Cemento Portland 25kg x 10 sacos',
            });

        expect(res.status).toBe(201);
        expect(res.body.deliveryNote.format).toBe('material');
    });

    it('rechaza sin token', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .send({ client: clientId.toString(), project: projectId.toString(), format: 'hours', hours: 4 });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/deliverynote', () => {
    it('devuelve la lista de albaranes de la empresa', async () => {
        await DeliveryNote.create([
            { user: userId, company: companyId, client: clientId, project: projectId, format: 'hours', hours: 4 },
            { user: userId, company: companyId, client: clientId, project: projectId, format: 'material', material: 'Ladrillos' },
        ]);

        const res = await request(app)
            .get('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.deliveryNotes).toHaveLength(2);
    });
});

describe('GET /api/deliverynote/:id', () => {
    it('devuelve un albarán por id con populate', async () => {
        const note = await DeliveryNote.create({
            user: userId, company: companyId, client: clientId, project: projectId, format: 'hours', hours: 6,
        });

        const res = await request(app)
            .get(`/api/deliverynote/${note._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.deliveryNote._id).toBe(note._id.toString());
    });

    it('devuelve 404 si no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/deliverynote/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/deliverynote/:id', () => {
    it('elimina un albarán no firmado', async () => {
        const note = await DeliveryNote.create({
            user: userId, company: companyId, client: clientId, project: projectId, format: 'hours', hours: 2,
        });

        const res = await request(app)
            .delete(`/api/deliverynote/${note._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('no permite eliminar un albarán firmado', async () => {
        const note = await DeliveryNote.create({
            user: userId, company: companyId, client: clientId, project: projectId,
            format: 'hours', hours: 3, signed: true, signatureUrl: 'data:image/png;base64,abc',
        });

        const res = await request(app)
            .delete(`/api/deliverynote/${note._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});

describe('GET /api/deliverynote/:id/pdf', () => {
    it('genera el PDF de un albarán de horas', async () => {
        const note = await DeliveryNote.create({
            user: userId, company: companyId, client: clientId, project: projectId,
            format: 'hours', hours: 8, description: 'Jornada test',
            workdate: new Date('2026-05-07'),
            workers: [{ name: 'Pepe García', hours: 8 }],
        });

        const res = await request(app)
            .get(`/api/deliverynote/${note._id}/pdf`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/pdf/);
    });

    it('genera el PDF de un albarán de material', async () => {
        const note = await DeliveryNote.create({
            user: userId, company: companyId, client: clientId, project: projectId,
            format: 'material', material: 'Cemento x 10 sacos',
            workdate: new Date('2026-05-07'),
        });

        const res = await request(app)
            .get(`/api/deliverynote/${note._id}/pdf`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('devuelve 404 para albarán inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .get(`/api/deliverynote/${fakeId}/pdf`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('Manejo de errores de base de datos', () => {
    it('devuelve 400 para ObjectId inválido en deliverynote', async () => {
        const res = await request(app)
            .get('/api/deliverynote/id-no-valido')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });

    it('devuelve 400 para ObjectId inválido en cliente', async () => {
        const res = await request(app)
            .get('/api/client/id-no-valido')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });

    it('devuelve 400 para ObjectId inválido en proyecto', async () => {
        const res = await request(app)
            .get('/api/project/id-no-valido')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});
