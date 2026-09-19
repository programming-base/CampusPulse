import express from "express";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import crypto from "crypto";

import otpModel from "../../models/authSchema/otpSchema.js";
import env from "../../config/env.js";

const router = express.Router();

const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

router.post("/auth/password/verify-otp", async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const otp = String(req.body.otp || "").trim();


        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a 6-digit code",
            });
        }

        const otpDoc = await otpModel
            .findOne({
                email,
                otpType: "forgot-password",
                otpUsed: false,
            })
            .sort({ createdAt: -1 });

        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Request a new OTP",
            });
        }
        const otpAge =
            Date.now() -
            new Date(otpDoc.createdAt).getTime();

        if (otpAge > OTP_EXPIRY_MS) {

            await otpModel.deleteOne({
                _id: otpDoc._id,
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Request a new OTP",
            });
        }

        if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {

            await otpModel.deleteOne({
                _id: otpDoc._id,
            });

            return res.status(429).json({
                success: false,
                message: "Maximum OTP attempts reached. Request a new OTP",
            });
        }

        const isOtpValid = await bcrypt.compare(
            otp,
            otpDoc.otp
        );
        if (!isOtpValid) {

            const updatedOtp = await otpModel.findOneAndUpdate(
                {
                    _id: otpDoc._id,
                    otpUsed: false,
                    attempts: {
                        $lt: OTP_MAX_ATTEMPTS,
                    },
                },
                {
                    $inc: {
                        attempts: 1,
                    },
                },
                {
                    new: true,
                }
            );

            if (!updatedOtp) {
                return res.status(429).json({
                    success: false,
                    message: "Maximum OTP attempts reached. Request a new OTP",
                });
            }

            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        const jti = crypto.randomUUID();


        const resetToken = JWT.sign(
            {
                userId: otpDoc.userId.toString(),
                purpose: "password-reset",
                jti,
            },
            env.JWT.RESET,
            {
                expiresIn: "10m",
            }
        );


        const resetTokenHash = await bcrypt.hash(
            resetToken,
            12
        );

        const consumedOtp = await otpModel.findOneAndUpdate(
            {
                _id: otpDoc._id,
                otpType: "forgot-password",
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

        if (!consumedOtp) {
            return res.status(400).json({
                success: false,
                message: "OTP is no longer valid. Request a new OTP",
            });
        }

        await otpModel.deleteMany({
            userId: consumedOtp.userId,
            otpType: "reset-password",
        });

        await otpModel.create({
            userId: consumedOtp.userId,
            email: consumedOtp.email,
            otp: "consumed",
            token: resetTokenHash,
            jti,
            otpType: "reset-password",
            attempts: 0,
            otpUsed: false,
        });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken,
        });

    } catch (error) {

        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;