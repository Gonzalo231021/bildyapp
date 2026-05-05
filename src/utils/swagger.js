import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BildyApp API',
            version: '1.0.0',
            description: 'API REST para gestión de clientes, proyectos y albaranes de obra',
        },
        servers: [
            { url: 'http://localhost:3000/api', description: 'Servidor local' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ClientInput: {
                    type: 'object',
                    required: ['name', 'cif'],
                    properties: {
                        name: { type: 'string', example: 'Constructora López S.L.' },
                        cif: { type: 'string', example: 'B12345678' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                number: { type: 'string' },
                                postal: { type: 'string' },
                                city: { type: 'string' },
                                province: { type: 'string' },
                            },
                        },
                    },
                },
                Client: {
                    allOf: [
                        { $ref: '#/components/schemas/ClientInput' },
                        {
                            type: 'object',
                            properties: {
                                _id: { type: 'string' },
                                company: { type: 'string' },
                                createdAt: { type: 'string', format: 'date-time' },
                            },
                        },
                    ],
                },
                DeliveryNote: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        client: { type: 'string', description: 'ID del cliente' },
                        project: { type: 'string', description: 'ID del proyecto' },
                        format: { type: 'string', enum: ['material', 'hours'] },
                        material: { type: 'string' },
                        hours: { type: 'number' },
                        description: { type: 'string' },
                        workdate: { type: 'string', format: 'date-time' },
                        workers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    hours: { type: 'number' },
                                },
                            },
                        },
                        signed: { type: 'boolean' },
                        signatureUrl: { type: 'string' },
                        pdfUrl: { type: 'string' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
