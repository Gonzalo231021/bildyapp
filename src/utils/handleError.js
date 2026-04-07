export const handleHttpError = (res, mensaje, code = 500) => {
    res.status(code).json({
        error: true,
        mensaje
    });
};