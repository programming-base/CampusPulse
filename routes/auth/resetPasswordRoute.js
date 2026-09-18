import express from "express";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

import userModel from "../../models/authSchema/userSchema.js";
import otpModel from "../../models/authSchema/otpSchema.js";
import tokenModel from "../../models/authSchema/tokenSchema.js";
import env from "../../config/env.js";

const router = express.Router();

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

router.post("/auth/password/reset", async (req, res) => {

    try {

        const resetToken = String(
            req.body.resetToken || ""
        ).trim();

        const newPassword = req.body.newPassword;

        /*
         * Validate input
         */

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required",
            });
        }

        /*
         * Validate password
         */

        if (
            typeof newPassword !== "string" ||
            newPassword.length < 8 ||
            newPassword.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be between 8 and 128 characters",
            });
        }

        /*
         * Verify JWT
         */

        let decodedToken;

        try {

            decodedToken = JWT.verify(
                resetToken,
                env.JWT.RESET
            );

        } catch (_error) {

            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        /*
         * Validate token payload
         */

        if (
            decodedToken.purpose !== "password-reset" ||
            !decodedToken.userId ||
            !decodedToken.jti
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid reset token",
            });
        }

        /*
         * Find reset-token record.
         *
         * jti binds this exact JWT to this exact DB record.
         */

        const resetRequest = await otpModel.findOne({
            userId: decodedToken.userId,
            jti: decodedToken.jti,
            otpType: "reset-password",
            otpUsed: false,
        });

        if (!resetRequest) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        /*
         * Check reset-token expiration
         */

        const tokenAge =
            Date.now() -
            new Date(resetRequest.createdAt).getTime();

        if (tokenAge > RESET_TOKEN_EXPIRY_MS) {

            await otpModel.deleteOne({
                _id: resetRequest._id,
            });

            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        /*
         * Compare supplied JWT against stored hash
         */

        const isResetTokenValid =
            await bcrypt.compare(
                resetToken,
                resetRequest.token
            );

        if (!isResetTokenValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        /*
         * Find user
         */

        const user = await userModel
            .findById(decodedToken.userId)
            .select("_id password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        /*
         * Prevent password reuse
         */

        const isSamePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from old password",
            });
        }

        /*
         * Hash new password
         */

        const hashedPassword =
            await bcrypt.hash(newPassword, 12);

        /*
         * Atomically consume reset token.
         *
         * This prevents the same reset token from
         * being used twice simultaneously.
         */

        const claimedResetRequest =
            await otpModel.findOneAndUpdate(
                {
                    _id: resetRequest._id,
                    otpUsed: false,
                },
                {
                    $set: {
                        otpUsed: true,
                    },
                },
                {
                    new: true,
                }
            );

        if (!claimedResetRequest) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        /*
         * Update password
         */

        await userModel.updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    password: hashedPassword,
                },
            }
        );

        /*
         * Delete all password-reset records
         */

        await otpModel.deleteMany({
            userId: user._id,
        });

        /*
         * Revoke all refresh tokens.
         *
         * This logs the user out from other devices.
         */

        await tokenModel.updateMany(
            {
                userId: user._id,
                type: "refresh",
            },
            {
                $set: {
                    isRevoked: true,
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
        });

    } catch (error) {

        console.error("Password reset error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;