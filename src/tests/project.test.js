import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';

let mongod;
let token;
let userId;
let companyId;
let clientId;

const JWT_SECRET = 'test_secret_bildyapp';

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    process.env.JWT_SECRET = JWT_SECRET;

    companyId = new mongoose.Types.ObjectId();

    const user = await User.create({
        email: 'test_project@bildyapp.com',
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
        name: 'Cliente Proyectos',
        cif: 'F99999999',
    });
    clientId = client._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await Project.deleteMany({});
});

describe('POST /api/project', () => {
    it('crea un proyecto correctamente', async () => {
        const res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Obra Norte', projectCode: 'OBR-001', client: clientId.toString() });

        expect(res.status).toBe(201);
        expect(res.body.project.name).toBe('Obra Norte');
        expect(res.body.project.projectCode).toBe('OBR-001');
    });

    it('rechaza si falta el cliente', async () => {
        const res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Sin cliente', projectCode: 'OBR-002' });

        expect(res.status).toBe(400);
    });

    it('rechaza código de proyecto duplicado en la misma empresa', async () => {
        await Project.create({ user: userId, company: companyId, client: clientId, name: 'Primero', projectCode: 'DUP-001' });

        const res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Segundo', projectCode: 'DUP-001', client: clientId.toString() });

        expect(res.status).toBe(409);
    });
});

describe('GET /api/project', () => {
    it('devuelve lista de proyectos con paginación', async () => {
        await Project.create([
            { user: userId, company: companyId, client: clientId, name: 'Proyecto A', projectCode: 'PA-001' },
            { user: userId, company: companyId, client: clientId, name: 'Proyecto B', projectCode: 'PB-001' },
        ]);

        const res = await request(app)
            .get('/api/project?page=1&limit=10')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.projects.length).toBeGreaterThanOrEqual(2);
        expect(res.body.totalItems).toBeDefined();
    });
});

describe('GET /api/project/:id', () => {
    it('devuelve un proyecto por id', async () => {
        const project = await Project.create({ user: userId, company: companyId, client: clientId, name: 'Proyecto Test', projectCode: 'PT-001' });

        const res = await request(app)
            .get(`/api/project/${project._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.project._id).toBe(project._id.toString());
    });

    it('devuelve 404 si no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/project/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/project/:id', () => {
    it('actualiza un proyecto correctamente', async () => {
        const project = await Project.create({ user: userId, company: companyId, client: clientId, name: 'Original', projectCode: 'UPD-001' });

        const res = await request(app)
            .put(`/api/project/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Actualizado', notes: 'Nuevas notas' });

        expect(res.status).toBe(200);
        expect(res.body.project.name).toBe('Actualizado');
    });

    it('devuelve 404 al actualizar proyecto inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .put(`/api/project/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'X' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/project/:id', () => {
    it('hace soft delete de un proyecto', async () => {
        const project = await Project.create({ user: userId, company: companyId, client: clientId, name: 'A Borrar', projectCode: 'DEL-001' });

        const res = await request(app)
            .delete(`/api/project/${project._id}?soft=true`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('hard delete de un proyecto', async () => {
        const project = await Project.create({ user: userId, company: companyId, client: clientId, name: 'Hard Delete', projectCode: 'HDL-001' });

        const res = await request(app)
            .delete(`/api/project/${project._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('devuelve 404 al borrar proyecto inexistente', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/project/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('GET /api/project/archived y PATCH restore', () => {
    it('lista proyectos archivados', async () => {
        const project = await Project.create({ user: userId, company: companyId, client: clientId, name: 'Archivado', projectCode: 'ARC-001' });
        await Project.softDeleteById(project._id, userId);

        const res = await request(app)
            .get('/api/project/archived')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.projects.length).toBeGreaterThanOrEqual(1);
    });

    it('restaura un proyecto archivado', async () => {
        const project = await Project.create({ user: userId, company: companyId, client: clientId, name: 'A Restaurar', projectCode: 'RES-001' });
        await Project.softDeleteById(project._id, userId);

        const res = await request(app)
            .patch(`/api/project/${project._id}/restore`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });
});

describe('GET /api/project con filtros', () => {
    it('filtra proyectos activos con ?active=true', async () => {
        await Project.create([
            { user: userId, company: companyId, client: clientId, name: 'Activo 1', projectCode: 'ACT-001', active: true },
            { user: userId, company: companyId, client: clientId, name: 'Activo 2', projectCode: 'ACT-002', active: true },
        ]);

        const res = await request(app)
            .get('/api/project?active=true')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.projects.every(p => p.active === true)).toBe(true);
    });

    it('filtra por nombre con ?name=', async () => {
        await Project.create({ user: userId, company: companyId, client: clientId, name: 'Reforma Interior', projectCode: 'NM-001' });

        const res = await request(app)
            .get('/api/project?name=reforma')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.projects.some(p => p.name.toLowerCase().includes('reforma'))).toBe(true);
    });
});
