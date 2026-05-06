import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import DeliveryNote from '../models/DeliveryNote.js';

const DB_URI = process.env.DB_URI;

const run = async () => {
    await mongoose.connect(DB_URI);
    console.log('Conectado a MongoDB');

    await DeliveryNote.deleteMany({});
    await Project.deleteMany({});
    await Client.deleteMany({});
    await Company.deleteMany({});
    await User.deleteMany({});
    console.log('Base de datos limpia');

    const hashedPassword = await bcrypt.hash('Password1', 10);

    const user = await User.create({
        email: 'demo@bildyapp.com',
        password: hashedPassword,
        name: 'Gonzalo',
        lastName: 'Martínez',
        nif: '12345678A',
        role: 'admin',
        status: 'verified',
    });

    const company = await Company.create({
        owner: user._id,
        name: 'BildyCorp SL',
        cif: 'B12345678',
        isFreelance: false,
        address: { street: 'Calle Mayor 1', city: 'Madrid', postal: '28001' },
    });

    await User.findByIdAndUpdate(user._id, { company: company._id });

    const clients = await Client.create([
        {
            user: user._id, company: company._id,
            name: 'Construcciones López SL',
            cif: 'A87654321',
            email: 'lopez@construcciones.com',
            address: { street: 'Calle Industria 10', city: 'Madrid', postal: '28001' },
        },
        {
            user: user._id, company: company._id,
            name: 'Reformas García e Hijos',
            cif: 'B11223344',
            email: 'garcia@reformas.com',
            address: { street: 'Avda. Constitución 5', city: 'Barcelona', postal: '08001' },
        },
        {
            user: user._id, company: company._id,
            name: 'Inmobiliaria Castellana',
            cif: 'C55667788',
            email: 'info@castellana.es',
            address: { street: 'Paseo de la Castellana 200', city: 'Madrid', postal: '28046' },
        },
    ]);

    const projects = await Project.create([
        {
            user: user._id, company: company._id, client: clients[0]._id,
            name: 'Reforma Oficina Central',
            projectCode: 'PROY-001',
            email: 'obra@reforma.com',
            address: { street: 'Gran Vía 45', city: 'Madrid', postal: '28013' },
            notes: 'Reforma completa planta baja — electricidad, fontanería y acabados',
        },
        {
            user: user._id, company: company._id, client: clients[0]._id,
            name: 'Instalación Nave Industrial',
            projectCode: 'PROY-002',
            email: 'nave@lopez.com',
            address: { street: 'Polígono Sur, parcela 14', city: 'Getafe', postal: '28906' },
        },
        {
            user: user._id, company: company._id, client: clients[1]._id,
            name: 'Rehabilitación Fachada',
            projectCode: 'PROY-003',
            email: 'fachada@garcia.com',
            address: { street: 'Carrer de Provença 80', city: 'Barcelona', postal: '08029' },
        },
        {
            user: user._id, company: company._id, client: clients[2]._id,
            name: 'Acondicionamiento Local Comercial',
            projectCode: 'PROY-004',
            email: 'local@castellana.es',
            address: { street: 'Paseo de la Castellana 200 local B', city: 'Madrid', postal: '28046' },
            notes: 'Reforma integral de local de 250m²',
        },
    ]);

    await DeliveryNote.create([
        {
            user: user._id, company: company._id,
            client: clients[0]._id, project: projects[0]._id,
            format: 'hours',
            hours: 8,
            description: 'Instalación eléctrica planta baja — cuadro de distribución y cableado',
            workdate: new Date('2026-04-14'),
            workers: [
                { name: 'Juan García', hours: 4 },
                { name: 'Pedro López', hours: 4 },
            ],
            signed: true,
            signatureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
            user: user._id, company: company._id,
            client: clients[0]._id, project: projects[0]._id,
            format: 'material',
            material: 'Cable eléctrico 100m + canaletas + caja de distribución Schneider',
            description: 'Material para instalación eléctrica planta baja',
            workdate: new Date('2026-04-15'),
            signed: true,
            signatureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
        {
            user: user._id, company: company._id,
            client: clients[0]._id, project: projects[1]._id,
            format: 'hours',
            hours: 16,
            description: 'Montaje estructura metálica nave — vigas y pilares',
            workdate: new Date('2026-04-22'),
            workers: [
                { name: 'Carlos Ruiz', hours: 8 },
                { name: 'Miguel Torres', hours: 8 },
            ],
        },
        {
            user: user._id, company: company._id,
            client: clients[1]._id, project: projects[2]._id,
            format: 'material',
            material: 'Andamios modulares 40m² + material de fijación',
            description: 'Montaje andamiaje para rehabilitación de fachada',
            workdate: new Date('2026-05-02'),
        },
        {
            user: user._id, company: company._id,
            client: clients[1]._id, project: projects[2]._id,
            format: 'hours',
            hours: 24,
            description: 'Trabajos de rehabilitación fachada — limpieza, enfoscado y pintura',
            workdate: new Date('2026-05-05'),
            workers: [
                { name: 'Antonio Sánchez', hours: 8 },
                { name: 'Francisco Jiménez', hours: 8 },
                { name: 'Luis Moreno', hours: 8 },
            ],
        },
        {
            user: user._id, company: company._id,
            client: clients[2]._id, project: projects[3]._id,
            format: 'hours',
            hours: 12,
            description: 'Demolición tabiques y preparación de superficies',
            workdate: new Date('2026-05-06'),
            workers: [
                { name: 'Roberto Díaz', hours: 6 },
                { name: 'Sergio Navarro', hours: 6 },
            ],
        },
        {
            user: user._id, company: company._id,
            client: clients[2]._id, project: projects[3]._id,
            format: 'material',
            material: 'Parquet roble natural 250m² + adhesivo Mapei + rodapiés',
            description: 'Material para solado de local comercial',
            workdate: new Date('2026-05-07'),
        },
    ]);

    console.log('\n✓ Seed completado con éxito');
    console.log('─────────────────────────────────');
    console.log('  Usuario: demo@bildyapp.com');
    console.log('  Password: Password1');
    console.log(`  Empresa: BildyCorp SL (CIF B12345678)`);
    console.log(`  Clientes: ${clients.length}`);
    console.log(`  Proyectos: ${projects.length}`);
    console.log('  Albaranes: 7 (2 firmados, 5 pendientes)');
    console.log('─────────────────────────────────\n');

    await mongoose.disconnect();
};

run().catch((err) => {
    console.error('Error en seed:', err);
    process.exit(1);
});
