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