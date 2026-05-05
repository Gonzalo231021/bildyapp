import sharp from 'sharp';

export const optimizeImage = async (buffer) => {
    const optimized = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

    return { buffer: optimized, mimetype: 'image/webp' };
};
