import express from "express";
import verifyAccessToken from "../../middlewares/verifyAccessToken.js";
import cloudinary, {
  uploadBufferToCloudinary,
  upload,
} from "../../config/cloudinary.js";
import userModel from "../../models/authSchema/userSchema.js";
const router = express.Router();

router.post(
  "/uploads/profile-photo",
  verifyAccessToken,
  upload.single("image"),
  async (req, res) => {
    let Upload;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file to upload" });
      }
      Upload = await uploadBufferToCloudinary(
        req.file.buffer,
        `campuspulse/profile-photo/${req.user.userId}`,
      );
      const updateProfilePic = await userModel.findByIdAndUpdate(
        req.user.userId,
        {
          $set: {
            photoURL: { url: Upload.secure_url, publicID: Upload.public_id },
          },
        },
        { new: true, runValidators: true },
      );
      if (!updateProfilePic) {
        await cloudinary.uploader.destroy(Upload.public_id);
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json({
        success: true,
        data: {
          url: Upload.secure_url,
          publicId: Upload.public_id,
        },
      });
    } catch (error) {
      if (Upload?.public_id) {
        await cloudinary.uploader.destroy(Upload.public_id);
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);
export default router;
