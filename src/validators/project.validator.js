import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().min(1).optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
}).optional();

const projectBodySchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    projectCode: z.string().min(1, 'El código del proyecto es obligatorio'),
    client: z.string().min(1, 'El cliente es obligatorio'),
    address: addressSchema,
    email: z.string().email('Email no válido').optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
});

export const createProjectValidator = z.object({
    body: projectBodySchema,
});

export const updateProjectValidator = z.object({
    body: projectBodySchema.partial(),
});
