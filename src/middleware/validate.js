import { ZodError } from "zod";

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    } catch (error) {
        if( error instanceof ZodError) {
            return res.status(400).json({
                error: true, 
                mensaje: 'Error de validación',
                detalles: error.issues.map((err) => ({
                    campo: err.path.join('.'),
                    mensaje: err.message
                }))
            });
        }
        next(error);
     }
};

export default validate;