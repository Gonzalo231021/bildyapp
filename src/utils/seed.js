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

    // IDs fijos — los .http los usan directamente después del seed
    const COMPANY_ID  = new mongoose.Types.ObjectId('aaa000000000000000000001');
    const CLIENT_ID   = new mongoose.Types.ObjectId('bbb000000000000000000001');
    const PROJECT_ID  = new mongoose.Types.ObjectId('ccc000000000000000000001');
    const NOTE_ID     = new mongoose.Types.ObjectId('ddd000000000000000000001');
    const COMPANY2_ID = new mongoose.Types.ObjectId('aaa000000000000000000002');

    // ── BILDYCORP SL — empresa principal ─────────────────────────────
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
        _id: COMPANY_ID,
        owner: user._id,
        name: 'BildyCorp SL',
        cif: 'B12345678',
        isFreelance: false,
        address: { street: 'Calle Mayor 1', city: 'Madrid', postal: '28001' },
    });

    await User.findByIdAndUpdate(user._id, { company: company._id });

    // Usuarios adicionales BildyCorp
    await User.create({
        email: 'encargado@bildyapp.com',
        password: hashedPassword,
        name: 'Carlos',
        lastName: 'Ruiz',
        nif: '11223344B',
        role: 'guest',
        status: 'verified',
        company: company._id,
    });

    await User.create({
        email: 'admin2@bildyapp.com',
        password: hashedPassword,
        name: 'Laura',
        lastName: 'Sánchez',
        nif: '55667788C',
        role: 'guest',
        status: 'verified',
        company: company._id,
    });

    await User.create({
        email: 'nuevo@bildyapp.com',
        password: hashedPassword,
        name: 'Pendiente',
        lastName: 'Verificación',
        role: 'guest',
        status: 'pending',
        verificationCode: '123456',
        verificationAttempts: 3,
    });

    // ── INTELIGENCIA MAXIMA SL — empresa de los compañeros ───────────
    const company2 = await Company.create({
        _id: COMPANY2_ID,
        owner: user._id,
        name: 'Inteligencia Maxima SL',
        cif: 'X99887766',
        isFreelance: false,
        address: { street: 'Calle de la Innovación 42', city: 'Madrid', postal: '28020' },
    });

    const victorUser = await User.create({
        email: 'victor@inteligenciamaxima.com',
        password: hashedPassword,
        name: 'Victor Manuel',
        lastName: 'Peiro',
        nif: 'P1111111A',
        role: 'admin',
        status: 'verified',
        company: company2._id,
    });
    await Company.findByIdAndUpdate(company2._id, { owner: victorUser._id });

    await User.create([
        {
            email: 'diego@inteligenciamaxima.com',
            password: hashedPassword,
            name: 'Diego Jaime',
            lastName: 'La Vega',
            nif: 'P2222222B',
            role: 'guest',
            status: 'verified',
            company: company2._id,
        },
        {
            email: 'pablo@inteligenciamaxima.com',
            password: hashedPassword,
            name: 'Pablo',
            lastName: 'González',
            nif: 'P3333333C',
            role: 'guest',
            status: 'verified',
            company: company2._id,
        },
        {
            email: 'ana@inteligenciamaxima.com',
            password: hashedPassword,
            name: 'Ana',
            lastName: 'Sierra',
            nif: 'P4444444D',
            role: 'guest',
            status: 'verified',
            company: company2._id,
        },
        {
            email: 'juanfelipe@inteligenciamaxima.com',
            password: hashedPassword,
            name: 'Juan Felipe',
            lastName: 'García',
            nif: 'P5555555E',
            role: 'guest',
            status: 'verified',
            company: company2._id,
        },
    ]);

    const c = { user: user._id, company: company._id };

    // ── CLIENTES ──────────────────────────────────────────────────────
    const clients = await Client.create([
        {
            _id: CLIENT_ID,
            ...c,
            name: 'Construcciones López SL',
            cif: 'A87654321',
            email: 'lopez@construcciones.com',
            address: { street: 'Calle Industria 10', city: 'Madrid', postal: '28001' },
        },
        {
            ...c,
            name: 'Reformas García e Hijos',
            cif: 'B11223344',
            email: 'garcia@reformas.com',
            address: { street: 'Avda. Constitución 5', city: 'Barcelona', postal: '08001' },
        },
        {
            ...c,
            name: 'Inmobiliaria Castellana SA',
            cif: 'C55667788',
            email: 'info@castellana.es',
            address: { street: 'Paseo de la Castellana 200', city: 'Madrid', postal: '28046' },
        },
        {
            ...c,
            name: 'Grupo Edificar Norte SL',
            cif: 'D99001122',
            email: 'proyectos@edificarnorte.com',
            address: { street: 'Calle Uría 42', city: 'Oviedo', postal: '33003' },
        },
        {
            ...c,
            name: 'Promotora Levante 2020 SL',
            cif: 'E33445566',
            email: 'obras@promotoralevante.es',
            address: { street: 'Avda. del Puerto 18', city: 'Valencia', postal: '46023' },
        },
        {
            ...c,
            name: 'Arquitectura Viva SLP',
            cif: 'F77889900',
            email: 'estudio@arquitecturaviva.es',
            address: { street: 'Calle Serrano 120', city: 'Madrid', postal: '28006' },
        },
        {
            ...c,
            name: 'Obras y Servicios Rápidos SL',
            cif: 'G12349876',
            email: 'contacto@osrapidos.com',
            address: { street: 'Polígono Industrial Oeste, nave 7', city: 'Alcorcón', postal: '28923' },
        },
    ]);

    // ── PROYECTOS ─────────────────────────────────────────────────────
    const projects = await Project.create([
        // López (cliente 0)
        {
            _id: PROJECT_ID,
            ...c, client: clients[0]._id,
            name: 'Reforma Oficina Central',
            projectCode: 'PROY-001',
            email: 'obra001@bildycorp.com',
            address: { street: 'Gran Vía 45', city: 'Madrid', postal: '28013' },
            notes: 'Reforma completa planta baja — electricidad, fontanería y acabados',
        },
        {
            ...c, client: clients[0]._id,
            name: 'Instalación Nave Industrial',
            projectCode: 'PROY-002',
            email: 'obra002@bildycorp.com',
            address: { street: 'Polígono Sur, parcela 14', city: 'Getafe', postal: '28906' },
            notes: 'Nave logística 2.000m² — estructura, cubierta y urbanización exterior',
        },
        // García (cliente 1)
        {
            ...c, client: clients[1]._id,
            name: 'Rehabilitación Fachada Provença',
            projectCode: 'PROY-003',
            email: 'obra003@bildycorp.com',
            address: { street: 'Carrer de Provença 80', city: 'Barcelona', postal: '08029' },
        },
        {
            ...c, client: clients[1]._id,
            name: 'Reforma Baños Bloque B',
            projectCode: 'PROY-004',
            email: 'obra004@bildycorp.com',
            address: { street: 'Carrer de Muntaner 210', city: 'Barcelona', postal: '08036' },
            notes: '24 baños — alicatado, fontanería y carpintería',
        },
        // Castellana (cliente 2)
        {
            ...c, client: clients[2]._id,
            name: 'Acondicionamiento Local Comercial',
            projectCode: 'PROY-005',
            email: 'obra005@bildycorp.com',
            address: { street: 'Paseo de la Castellana 200 local B', city: 'Madrid', postal: '28046' },
            notes: 'Reforma integral local 250m²',
        },
        {
            ...c, client: clients[2]._id,
            name: 'Construcción Parking Subterráneo',
            projectCode: 'PROY-006',
            email: 'obra006@bildycorp.com',
            address: { street: 'Calle Orense 10', city: 'Madrid', postal: '28020' },
            notes: '3 plantas subterráneas, 120 plazas',
        },
        // Grupo Edificar Norte (cliente 3)
        {
            ...c, client: clients[3]._id,
            name: 'Urbanización Residencial Las Flores',
            projectCode: 'PROY-007',
            email: 'obra007@bildycorp.com',
            address: { street: 'Camino de la Vega s/n', city: 'Gijón', postal: '33210' },
            notes: '40 viviendas unifamiliares + zonas comunes',
        },
        // Promotora Levante (cliente 4)
        {
            ...c, client: clients[4]._id,
            name: 'Torre Residencial Puerto',
            projectCode: 'PROY-008',
            email: 'obra008@bildycorp.com',
            address: { street: 'Avda. del Puerto 22', city: 'Valencia', postal: '46023' },
            notes: 'Bloque 18 plantas — estructura HA, fachada ventilada',
        },
        {
            ...c, client: clients[4]._id,
            name: 'Rehabilitación Edificio Historico Centro',
            projectCode: 'PROY-009',
            email: 'obra009@bildycorp.com',
            address: { street: 'Calle de la Paz 7', city: 'Valencia', postal: '46003' },
            notes: 'Edificio protegido s.XIX — consolidación estructural y restauración',
        },
        // Arquitectura Viva (cliente 5)
        {
            ...c, client: clients[5]._id,
            name: 'Vivienda Unifamiliar Sierra',
            projectCode: 'PROY-010',
            email: 'obra010@bildycorp.com',
            address: { street: 'Urbanización La Moraleja, parcela 33', city: 'Alcobendas', postal: '28109' },
        },
        // Obras y Servicios Rápidos (cliente 6)
        {
            ...c, client: clients[6]._id,
            name: 'Mantenimiento Centros Comerciales Q1',
            projectCode: 'PROY-011',
            email: 'obra011@bildycorp.com',
            address: { street: 'Polígono Industrial Oeste, nave 7', city: 'Alcorcón', postal: '28923' },
            notes: 'Contrato mantenimiento trimestral — 5 centros comerciales',
        },
    ]);

    const sig = { signed: true, signatureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

    // ── ALBARANES ─────────────────────────────────────────────────────
    await DeliveryNote.create([
        // PROY-001 Reforma Oficina Central (firmados — trabajo cerrado)
        {
            _id: NOTE_ID,
            ...c, client: clients[0]._id, project: projects[0]._id, ...sig,
            format: 'hours', hours: 8,
            description: 'Instalación eléctrica planta baja — cuadro de distribución y cableado',
            workdate: new Date('2026-03-10'),
            workers: [{ name: 'Juan García', hours: 4 }, { name: 'Pedro López', hours: 4 }],
        },
        {
            ...c, client: clients[0]._id, project: projects[0]._id, ...sig,
            format: 'material',
            material: 'Cable eléctrico NYM 3×2.5mm 200m + canaletas PVC + caja Schneider iC60N',
            description: 'Material instalación eléctrica planta baja',
            workdate: new Date('2026-03-11'),
        },
        {
            ...c, client: clients[0]._id, project: projects[0]._id, ...sig,
            format: 'hours', hours: 12,
            description: 'Fontanería: instalación red de agua fría/caliente y desagüe cocina',
            workdate: new Date('2026-03-18'),
            workers: [{ name: 'Antonio Sánchez', hours: 6 }, { name: 'Francisco Jiménez', hours: 6 }],
        },
        {
            ...c, client: clients[0]._id, project: projects[0]._id, ...sig,
            format: 'material',
            material: 'Tubería PEX 16mm 150m + colector latón + llaves de paso Orkli',
            description: 'Material fontanería oficina central',
            workdate: new Date('2026-03-18'),
        },
        {
            ...c, client: clients[0]._id, project: projects[0]._id, ...sig,
            format: 'hours', hours: 16,
            description: 'Alicatado y solado baños planta baja — 4 aseos',
            workdate: new Date('2026-03-25'),
            workers: [{ name: 'Carlos Ruiz', hours: 8 }, { name: 'Miguel Torres', hours: 8 }],
        },

        // PROY-002 Nave Industrial (en curso)
        {
            ...c, client: clients[0]._id, project: projects[1]._id, ...sig,
            format: 'hours', hours: 40,
            description: 'Cimentación y solera de hormigón HA-25 — 1.200m²',
            workdate: new Date('2026-02-03'),
            workers: [
                { name: 'Roberto Díaz', hours: 10 },
                { name: 'Sergio Navarro', hours: 10 },
                { name: 'Luis Moreno', hours: 10 },
                { name: 'David Campos', hours: 10 },
            ],
        },
        {
            ...c, client: clients[0]._id, project: projects[1]._id, ...sig,
            format: 'material',
            material: 'Hormigón HA-25/B/20/IIa 80m³ + mallazo ME 15×15 ø8 300m² + separadores',
            description: 'Material cimentación nave',
            workdate: new Date('2026-02-03'),
        },
        {
            ...c, client: clients[0]._id, project: projects[1]._id,
            format: 'hours', hours: 16,
            description: 'Montaje estructura metálica — vigas IPE 300 y pilares HEB 200',
            workdate: new Date('2026-04-22'),
            workers: [{ name: 'Carlos Ruiz', hours: 8 }, { name: 'Miguel Torres', hours: 8 }],
        },
        {
            ...c, client: clients[0]._id, project: projects[1]._id,
            format: 'material',
            material: 'Acero S275JR — vigas IPE 300 × 12 uds + pilares HEB 200 × 8 uds + tornillería',
            description: 'Material estructura metálica nave',
            workdate: new Date('2026-04-21'),
        },

        // PROY-003 Fachada Barcelona (firmados)
        {
            ...c, client: clients[1]._id, project: projects[2]._id, ...sig,
            format: 'material',
            material: 'Andamios modulares LAYHER 40m² + anclajes fachada + redes de protección',
            description: 'Montaje andamiaje para rehabilitación de fachada',
            workdate: new Date('2026-04-07'),
        },
        {
            ...c, client: clients[1]._id, project: projects[2]._id, ...sig,
            format: 'hours', hours: 24,
            description: 'Limpieza fachada con hidrolavado + reparación fisuras + enfoscado de cemento',
            workdate: new Date('2026-04-14'),
            workers: [
                { name: 'Antonio Sánchez', hours: 8 },
                { name: 'Francisco Jiménez', hours: 8 },
                { name: 'Luis Moreno', hours: 8 },
            ],
        },
        {
            ...c, client: clients[1]._id, project: projects[2]._id,
            format: 'hours', hours: 16,
            description: 'Pintura exterior fachada — imprimación + 2 manos pintura siloxánica',
            workdate: new Date('2026-05-05'),
            workers: [{ name: 'Francisco Jiménez', hours: 8 }, { name: 'Luis Moreno', hours: 8 }],
        },

        // PROY-004 Baños Barcelona
        {
            ...c, client: clients[1]._id, project: projects[3]._id,
            format: 'material',
            material: 'Porcelánico Rectificado 60×60 blanco mate 200m² + adhesivo C2TE S1 + lechada',
            description: 'Material alicatado baños bloque B',
            workdate: new Date('2026-05-04'),
        },
        {
            ...c, client: clients[1]._id, project: projects[3]._id,
            format: 'hours', hours: 32,
            description: 'Alicatado paredes y solado baños — 8 baños primera planta',
            workdate: new Date('2026-05-06'),
            workers: [
                { name: 'Carlos Ruiz', hours: 8 },
                { name: 'Roberto Díaz', hours: 8 },
                { name: 'Sergio Navarro', hours: 8 },
                { name: 'David Campos', hours: 8 },
            ],
        },

        // PROY-005 Local Castellana
        {
            ...c, client: clients[2]._id, project: projects[4]._id, ...sig,
            format: 'hours', hours: 12,
            description: 'Demolición tabiques y preparación de superficies para nueva distribución',
            workdate: new Date('2026-04-28'),
            workers: [{ name: 'Roberto Díaz', hours: 6 }, { name: 'Sergio Navarro', hours: 6 }],
        },
        {
            ...c, client: clients[2]._id, project: projects[4]._id,
            format: 'material',
            material: 'Parquet roble natural 250m² + adhesivo Mapei Ultrabond Eco 575 + rodapiés roble',
            description: 'Material solado parquet local comercial',
            workdate: new Date('2026-05-06'),
        },
        {
            ...c, client: clients[2]._id, project: projects[4]._id,
            format: 'hours', hours: 20,
            description: 'Colocación parquet flotante y rodapiés — local 250m²',
            workdate: new Date('2026-05-07'),
            workers: [{ name: 'Juan García', hours: 10 }, { name: 'Pedro López', hours: 10 }],
        },

        // PROY-006 Parking Castellana
        {
            ...c, client: clients[2]._id, project: projects[5]._id,
            format: 'hours', hours: 48,
            description: 'Excavación y entibación — planta -1 (1.800m²)',
            workdate: new Date('2026-03-03'),
            workers: [
                { name: 'Roberto Díaz', hours: 12 },
                { name: 'Sergio Navarro', hours: 12 },
                { name: 'David Campos', hours: 12 },
                { name: 'Miguel Torres', hours: 12 },
            ],
        },
        {
            ...c, client: clients[2]._id, project: projects[5]._id,
            format: 'material',
            material: 'Tablestacas metálicas LP6 × 80 uds + vigas de atado HEB 160 + bombeo agua',
            description: 'Material entibación excavación parking',
            workdate: new Date('2026-03-03'),
        },

        // PROY-007 Urbanización Gijón
        {
            ...c, client: clients[3]._id, project: projects[6]._id, ...sig,
            format: 'hours', hours: 56,
            description: 'Movimiento de tierras y explanación parcelas 1–20',
            workdate: new Date('2026-01-15'),
            workers: [
                { name: 'Carlos Ruiz', hours: 14 },
                { name: 'Luis Moreno', hours: 14 },
                { name: 'Antonio Sánchez', hours: 14 },
                { name: 'David Campos', hours: 14 },
            ],
        },
        {
            ...c, client: clients[3]._id, project: projects[6]._id, ...sig,
            format: 'material',
            material: 'Hormigón HA-25 120m³ + acero B500S 8.400kg + encofrado metálico 600m²',
            description: 'Material cimentaciones viviendas 1–10',
            workdate: new Date('2026-02-10'),
        },
        {
            ...c, client: clients[3]._id, project: projects[6]._id,
            format: 'hours', hours: 32,
            description: 'Instalación red de saneamiento pluviales y fecales urbanización',
            workdate: new Date('2026-04-20'),
            workers: [
                { name: 'Francisco Jiménez', hours: 8 },
                { name: 'Antonio Sánchez', hours: 8 },
                { name: 'Pedro López', hours: 8 },
                { name: 'Juan García', hours: 8 },
            ],
        },

        // PROY-008 Torre Valencia
        {
            ...c, client: clients[4]._id, project: projects[7]._id, ...sig,
            format: 'hours', hours: 64,
            description: 'Estructura HA plantas 1–6 — encofrado, ferrallado y hormigonado',
            workdate: new Date('2026-02-17'),
            workers: [
                { name: 'Roberto Díaz', hours: 16 },
                { name: 'Sergio Navarro', hours: 16 },
                { name: 'David Campos', hours: 16 },
                { name: 'Miguel Torres', hours: 16 },
            ],
        },
        {
            ...c, client: clients[4]._id, project: projects[7]._id,
            format: 'material',
            material: 'Fachada ventilada Porcelanosa Ston-ker 3.600m² + subestructura aluminio + fijaciones',
            description: 'Material fachada ventilada plantas 7–18',
            workdate: new Date('2026-05-02'),
        },

        // PROY-009 Edificio Histórico Valencia
        {
            ...c, client: clients[4]._id, project: projects[8]._id, ...sig,
            format: 'hours', hours: 20,
            description: 'Consolidación estructural — inyecciones epoxi en muros y recalce cimentación',
            workdate: new Date('2026-03-23'),
            workers: [{ name: 'Carlos Ruiz', hours: 10 }, { name: 'Luis Moreno', hours: 10 }],
        },
        {
            ...c, client: clients[4]._id, project: projects[8]._id,
            format: 'hours', hours: 24,
            description: 'Restauración carpintería de madera original — ventanas y balcones planta 1–3',
            workdate: new Date('2026-05-05'),
            workers: [
                { name: 'Antonio Sánchez', hours: 8 },
                { name: 'Francisco Jiménez', hours: 8 },
                { name: 'Juan García', hours: 8 },
            ],
        },

        // PROY-010 Vivienda Unifamiliar
        {
            ...c, client: clients[5]._id, project: projects[9]._id, ...sig,
            format: 'hours', hours: 10,
            description: 'Instalación suelo radiante — 280m² planta baja y primera',
            workdate: new Date('2026-04-08'),
            workers: [{ name: 'Pedro López', hours: 5 }, { name: 'Juan García', hours: 5 }],
        },
        {
            ...c, client: clients[5]._id, project: projects[9]._id,
            format: 'material',
            material: 'Sistema suelo radiante Uponor 280m² + colectores + bomba de calor Daikin 16kW',
            description: 'Material climatización vivienda unifamiliar',
            workdate: new Date('2026-04-08'),
        },

        // PROY-011 Mantenimiento Centros Comerciales
        {
            ...c, client: clients[6]._id, project: projects[10]._id, ...sig,
            format: 'hours', hours: 16,
            description: 'Revisión y mantenimiento preventivo instalaciones eléctricas — CC Norte y Sur',
            workdate: new Date('2026-04-01'),
            workers: [{ name: 'Miguel Torres', hours: 8 }, { name: 'David Campos', hours: 8 }],
        },
        {
            ...c, client: clients[6]._id, project: projects[10]._id, ...sig,
            format: 'hours', hours: 8,
            description: 'Reparación urgente sistema contra incendios — CC Centro',
            workdate: new Date('2026-04-15'),
            workers: [{ name: 'Carlos Ruiz', hours: 4 }, { name: 'Roberto Díaz', hours: 4 }],
        },
        {
            ...c, client: clients[6]._id, project: projects[10]._id,
            format: 'hours', hours: 12,
            description: 'Mantenimiento correctivo climatización — CC Este y Oeste',
            workdate: new Date('2026-05-05'),
            workers: [{ name: 'Sergio Navarro', hours: 6 }, { name: 'Luis Moreno', hours: 6 }],
        },
        {
            ...c, client: clients[6]._id, project: projects[10]._id,
            format: 'material',
            material: 'Filtros HEPA G4+F7 × 40 uds + correas transmisión + kit mantenimiento Carrier',
            description: 'Material mantenimiento climatización Q1 2026',
            workdate: new Date('2026-05-05'),
        },
    ]);

    const totalNotes = 34;
    const signed = 18;
    console.log('\n✓ Seed completado con éxito');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  USUARIOS (todos con password: Password1)');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  BildyCorp SL:');
    console.log('    demo@bildyapp.com            → admin  (propietario)');
    console.log('    encargado@bildyapp.com        → guest');
    console.log('    admin2@bildyapp.com           → guest');
    console.log('    nuevo@bildyapp.com            → pending (código: 123456)');
    console.log('  Inteligencia Maxima SL:');
    console.log('    victor@inteligenciamaxima.com → admin');
    console.log('    diego@inteligenciamaxima.com  → guest');
    console.log('    pablo@inteligenciamaxima.com  → guest');
    console.log('    ana@inteligenciamaxima.com    → guest');
    console.log('    juanfelipe@inteligenciamaxima.com → guest');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  IDs fijos para los .http:');
    console.log(`    clientId:   ${CLIENT_ID}`);
    console.log(`    projectId:  ${PROJECT_ID}`);
    console.log(`    noteId:     ${NOTE_ID}`);
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`  Clientes: ${clients.length}  Proyectos: ${projects.length}  Albaranes: ${totalNotes} (${signed} firmados)`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
};

run().catch((err) => {
    console.error('Error en seed:', err);
    process.exit(1);
});
