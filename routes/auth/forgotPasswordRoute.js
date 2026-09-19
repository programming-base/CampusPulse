import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";

import otpModel from "../../models/authSchema/otpSchema.js";
import userModel from "../../models/authSchema/userSchema.js";
import env from "../../config/env.js";

const router = express.Router();

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const requestTimestamps = new Map();

const genericResponse = {
    success: true,
    message: "If an account exists for this email, a reset code has been sent.",
};

const createTransport = async () => {
    const { HOST, PORT, SECURE, USER, PASS } = env.SMTP;

    if (HOST && PORT && USER && PASS) {
        return nodemailer.createTransport({
            host: HOST,
            port: PORT,
            secure: SECURE,
            auth: {
                user: USER,
                pass: PASS,
            },
        });
    }

    // Development fallback
    const testAccount = await nodemailer.createTestAccount();

    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

const sendResetOtpMail = async (email, otp) => {
    const transporter = await createTransport();

    const info = await transporter.sendMail({
        from: env.SMTP.FROM,
        to: email,
        subject: "CampusPulse Password Reset OTP",

        text: `
Your CampusPulse password reset OTP is:

${otp}

This OTP expires in 10 minutes.

If you did not request a password reset, you can safely ignore this email.
        `,

        html: `
            <h2>CampusPulse Password Reset</h2>

            <p>Your password reset OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP expires in <strong>10 minutes</strong>.</p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>
        `,
    });

    return nodemailer.getTestMessageUrl(info) || null;
};

router.post("/auth/password/forgot", async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return res.status(200).json(genericResponse);
        }

        /*
         * Rate limiting
         */

        const now = Date.now();

        const timestamps = (
            requestTimestamps.get(email) || []
        ).filter(
            (timestamp) =>
                now - timestamp < RATE_LIMIT_WINDOW_MS
        );

        if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
            return res.status(200).json(genericResponse);
        }

        timestamps.push(now);

        requestTimestamps.set(email, timestamps);

        /*
         * Find user
         */

        const user = await userModel
            .findOne({ email })
            .select("_id email");

        if (!user) {
            return res.status(200).json(genericResponse);
        }

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        const otpHash = await bcrypt.hash(otp, 12);

        await otpModel.deleteMany({
            userId: user._id,
            otpType: "forgot-password",
        });
        const jti=crypto.randomUUID();
        await otpModel.create({
            userId: user._id,
            email: user.email,
            otp: otpHash,
            jti:jti,
            token: null,
            otpType: "forgot-password",
            attempts: 0,
            otpUsed: false,
        });

        await sendResetOtpMail(email, otp);

        return res.status(200).json(genericResponse);

    } catch (error) {

        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;