import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().min(1).optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
}).optional();

export const createClientValidator = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    cif: z.string().min(1, 'El CIF es obligatorio'),
    email: z.string().email('Email no válido').optional(),
    phone: z.string().optional(),
    address: addressSchema,
});

export const updateClientValidator = createClientValidator.partial();
