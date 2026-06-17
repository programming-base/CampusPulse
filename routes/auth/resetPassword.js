import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken'
import userModel from '../../database/schema/authSchema/userSchema.js';
import otpModel from '../../database/schema/authSchema/otp.js';

const router =express.Router();

const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const createTransport = async () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
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
    from: process.env.SMTP_FROM || '"CampusPulse" <no-reply@campuspulse.local>',
    to: email,
    subject: 'CampusPulse Password Reset OTP',
    text: `Your CampusPulse OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your CampusPulse OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  return previewUrl || null;
};

router.post('/auth/reset-password',async (req,res)=>{

    try{
        const { email, otp, newPassword, resetToken } = req.body;

        if(!email){
            return res.status(400).json({error:'Email is required'})
        }

        const user = await userModel.findOne({ email }).select('email password');
        if(!user){
            return res.status(400).json({error:'The email is not valid'})
        }

        const isVerificationRequest = Boolean(otp && newPassword && resetToken);

        if(!isVerificationRequest){
            const otpCode = crypto.randomInt(100000,1000000).toString();
            const hashedOtp = await bcrypt.hash(otpCode,10);
            if(!hashedOtp) return res.status(500).json({message:'Internal server error'})

            const token = JWT.sign(
              { email, purpose: 'password-reset' },
              process.env.JWT_ACCESS,
              { expiresIn: '10m' }
            );

            await otpModel.deleteMany({ email });
            await otpModel.create({ otp: hashedOtp, email, token, createdAt: new Date() });

            const previewUrl = await sendResetOtpMail(email, otpCode);
            const responsePayload = { message: 'OTP sent to email', resetToken: token };

            if (previewUrl) {
              responsePayload.previewUrl = previewUrl;
            }

            return res.status(200).json(responsePayload);
        }

        let decodedToken;
        try {
          decodedToken = JWT.verify(resetToken, process.env.JWT_ACCESS);
        } catch (_error) {
          return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        if(decodedToken.email !== email || decodedToken.purpose !== 'password-reset'){
          return res.status(401).json({ error: 'Invalid reset token payload' });
        }

        const otpDoc = await otpModel.findOne({ email, token: resetToken }).sort({ createdAt: -1 });
        if(!otpDoc){
          return res.status(400).json({error:'OTP not found. Request a new OTP'})
        }

        const otpAge = Date.now() - new Date(otpDoc.createdAt).getTime();
        if(otpAge > OTP_EXPIRY_MS){
          await otpModel.deleteMany({ email });
          return res.status(400).json({error:'OTP has expired. Request a new OTP'})
        }

        if(otpDoc.attempts >= OTP_MAX_ATTEMPTS){
          return res.status(429).json({error:'Maximum OTP attempts reached. Request a new OTP'})
        }

        const isOtpValid = await bcrypt.compare(String(otp), otpDoc.otp);
        if(!isOtpValid){
          await otpModel.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });
          return res.status(400).json({error:'Invalid OTP'})
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if(isSamePassword){
          return res.status(400).json({error:'New password must be different from old password'})
        }

        const hashedPassword = await bcrypt.hash(newPassword,10);
        if(!hashedPassword){
          return res.status(500).json({message:'Password hashing failed'})
        }

        await userModel.updateOne({ email }, { $set: { password: hashedPassword } });
        await otpModel.deleteMany({ email });

        return res.status(200).json({message:'Password reset successful'})
    }catch(err){
        return res.status(500).json({error:'Server error'})
    }
    
})
export default router;