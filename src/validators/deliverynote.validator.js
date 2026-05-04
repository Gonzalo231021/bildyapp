import { z } from 'zod';

const deliveryNoteBodySchema = z.object({
    client: z.string().min(1, 'El cliente es obligatorio'),
    project: z.string().min(1, 'El proyecto es obligatorio'),
    format: z.enum(['material', 'hours'], {
        errorMap: () => ({ message: 'El formato debe ser material u hours' }),
    }),
    material: z.string().optional(),
    hours: z.number().min(0).optional(),
    description: z.string().optional(),
    workdate: z.string().optional(),
    workers: z.array(
        z.object({
            name: z.string().optional(),
            hours: z.number().min(0).optional(),
        })
    ).optional(),
}).refine(
    (data) => {
        if (data.format === 'material') return !!data.material;
        if (data.format === 'hours') return data.hours !== undefined;
        return true;
    },
    { message: 'Debes proporcionar material o hours según el formato elegido' }
);

export const createDeliveryNoteValidator = z.object({
    body: deliveryNoteBodySchema,
});

export const updateDeliveryNoteValidator = z.object({
    body: z.object({
        client: z.string().optional(),
        project: z.string().optional(),
        format: z.enum(['material', 'hours']).optional(),
        material: z.string().optional(),
        hours: z.number().min(0).optional(),
        description: z.string().optional(),
        workdate: z.string().optional(),
        workers: z.array(
            z.object({
                name: z.string().optional(),
                hours: z.number().min(0).optional(),
            })
        ).optional(),
    }),
});
