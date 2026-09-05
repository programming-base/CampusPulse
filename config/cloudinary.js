import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';
import env from './env.js';

const upload = multer({ storage: multer.memoryStorage() });
function uploadBufferToCloudinary(fileBuffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            } 
        );
        Readable.from(fileBuffer).pipe(stream);
    });
}

cloudinary.config({
    cloud_name: env.CLOUDINARY.CLOUD_NAME,
    api_key: env.CLOUDINARY.API_KEY,
    api_secret: env.CLOUDINARY.API_SECRET,
});



export default cloudinary;
export {uploadBufferToCloudinary};
export {upload};
