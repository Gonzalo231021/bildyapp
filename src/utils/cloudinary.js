import { v2 as cloudinary } from 'cloudinary';

export const uploadToCloudinary = (buffer, mimetype) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
        const ext = mimetype.split('/')[1] || 'png';
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'bildyapp/signatures',
                format: ext,
                resource_type: 'image',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
};
