export const buildPaginationQuery = ({ page = 1, limit = 10, sort = '-createdAt' } = {}) => {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    return { skip, limit: limitNum, sort, pageNum };
};

export const buildPaginationResponse = (total, limitNum, pageNum) => ({
    totalItems: total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
});
