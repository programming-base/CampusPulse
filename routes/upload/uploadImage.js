
import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import cloudinary,{uploadBufferToCloudinary,upload} from './cloudinary.js';
const router = express.Router();
router.post('/uploads/image', verifyAccessToken, upload.array('images', 5), async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: 'No images provided' });
		}

		const uploads = await Promise.all(
			req.files.map((file) => uploadBufferToCloudinary(file.buffer, 'users'))
		);
		
		res.status(201).json({
			success: true,
			data: uploads.map((file) => ({
				url: file.secure_url,
				publicId: file.public_id,
			})),
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to upload images' });
	}
});
export default router;