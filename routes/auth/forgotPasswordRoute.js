import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

import otpModel from "../../models/authSchema/otpSchema.js";
import userModel from "../../models/authSchema/userSchema.js";
import env from "../../config/env.js";

const router = express.Router();
const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

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
    text: `Your CampusPulse OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your CampusPulse OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  return previewUrl || null;
};

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email, otp, forgotPassToken, newPassword } = req.body;
    const user = (await userModel.findOne({ email: email }));
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email does not exist",
      });
    }
    const isReqBodyPresent = Boolean(otp && forgotPassToken && newPassword);
    if (!isReqBodyPresent) {
      const OTP = crypto.randomInt(100000, 1000000).toString();
      const hashedOtp = await bcrypt.hash(OTP, 10);
      const newToken = JWT.sign(
        {
          email,
          purpose: "forgot-password-reset",
        },
        env.JWT.ACCESS,
        { expiresIn: "5m" },
      );
      await otpModel.deleteMany({ email:email });
      await otpModel.create({
        email: email,
        otp: hashedOtp,
        token: newToken,
        otpType: "forgot-password",
        createdAt: new Date(),
      });
      const previewUrl = await sendResetOtpMail(email, OTP);
      const responsePayload = {
        message: "OTP sent to email",
        token: newToken,
      };
      if(previewUrl){
        responsePayload.previewUrl = previewUrl
      }
      return res.status(200).json(responsePayload);
      
    }

    let decodedToken = JWT.verify(forgotPassToken, env.JWT.ACCESS);


    if (
      decodedToken.email !== user.email||
      decodedToken.purpose !== "forgot-password-reset"
    ) {
      return res.status(400).json({ 
        success:false,
        message:'Invalid email or token type'
     });
    }
    const otpDoc = await otpModel
      .findOne({ email, token: forgotPassToken })
      .sort({ createdAt: -1 });
    if (!otpDoc) {
      return res
        .status(400)
        .json({ error: "OTP not found. Request a new OTP" });
    }
    const otpAge = Date.now() - new Date(otpDoc.createdAt).getTime();
    if (otpAge > OTP_EXPIRY_MS) {
      await otpModel.deleteMany({ email });
      return res
        .status(400)
        .json({ error: "OTP has expired. Request a new OTP" });
    }
    if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
      await otpModel.deleteMany({ email });
      return res
        .status(429)
        .json({
          error: "reached the highest attempts, try again after some times",
        });
    }

    const isOtpValid = await bcrypt.compare(String(otp), otpDoc.otp);
    if (!isOtpValid) {
      await otpModel.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } }); 
      return res.status(400).json({ error: "Invalid otp " });
    }
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password,
    );

    if (samePassword) {
      return res
        .status(400)
        .json({ error: "New password must be different from old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await userModel.updateOne(
      { email },
      { $set: { password: hashedPassword } },
    );
    await otpModel.deleteMany({ email });
    res.status(200).json({ 
      success:true,
      message: "Password reset successful" 
    });
  } catch (error) {
    return res.status(500).json({
        success:false,
        message:'Internal server error',
        error: error.message
    });
  }
});

export default router;
