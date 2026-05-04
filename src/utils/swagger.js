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
