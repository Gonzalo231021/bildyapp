import { z } from "zod";

export const registerValidator = z.object ({
    body: z.object({
        email: z.string()
        .email('El email no es válido')
        .transform(val => val.toLowerCase()
        .trim()),
        password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    })
});

export const validationCodeValidator = z.object({
    body: z.object({
        code: z.string().length(6, 'El código de verificación debe tener 6 dígitos')
    })
});

const addressSchema = z.object({
    street:   z.string().trim().optional(),
    number:   z.string().trim().optional(),
    postal:   z.string().trim().optional(),
    city:     z.string().trim().optional(),
    province: z.string().trim().optional(),
}).optional();

export const personalDataValidator = z.object({
    body: z.object({
        name:     z.string().trim().min(1, 'El nombre es obligatorio'),
        lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
        nif:      z.string().trim().min(1, 'El NIF es obligatorio'),
        address:  addressSchema,
    })
});

// Bonus: discriminatedUnion según isFreelance
const companyFreelanceSchema = z.object({
    isFreelance: z.literal(true),
});

const companyNormalSchema = z.object({
    isFreelance: z.literal(false).default(false),
    name:    z.string().trim().min(1, 'El nombre de la empresa es obligatorio'),
    cif:     z.string().trim().min(1, 'El CIF es obligatorio'),
    address: addressSchema,
});

export const companyDataValidator = z.object({
    body: z.discriminatedUnion('isFreelance', [
        companyFreelanceSchema,
        companyNormalSchema,
    ])
});

export const refreshTokenValidator = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'El refresh token es obligatorio'),
    })
});
