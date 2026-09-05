import express from "express";
import bcrypt from "bcrypt";
import userModel from "../../models/authSchema/userSchema.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import tokenModel from "../../models/authSchema/tokenSchema.js";
import env from "../../config/env.js";

const router = express.Router();

router.post("/auth/register", async (req, res) => {
  
  const {
    displayName,
    email,
    password,
    college,
    department,
    academicYear,
    userName,
  } = req.body;
  if (
    !displayName ||
    !email ||
    !password ||
    !college ||
    !department ||
    !academicYear ||
    !userName
  ) {
    return res.status(400).json({ error: "Please provide proper information" });
  }
  let savedUser;
  try {
    const emailExists = await userModel.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      photoURL: "uewihfnfdsk",
      displayName,
      email,
      userName,
      password: hashedPassword,
      college,
      department,
      academicYear,
    };
    
    let refreshToken;
    savedUser = await userModel.create(user);
    const savedUserObject=savedUser.toObject();
    delete savedUserObject.password;
    const tokenId=new mongoose.Types.ObjectId();
    
    refreshToken = jwt.sign(
      {tokenId:tokenId,userId: savedUser._id, email, type: "refresh" },
      env.JWT.REFRESH,
      { expiresIn: "7d" },
    );

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const jsonToken = {
      _id:tokenId,
      userId: savedUser._id,
      token: hashedToken,
      type: "refresh",
      expiresIn: expiresAt,
    };

    await tokenModel.create(jsonToken);

    const accessToken = jwt.sign(
      {
        userId: savedUser._id,
        email: email,
        type: "access",
      },
      env.JWT.ACCESS,
      { expiresIn: "5m" },
    );
    res.status(201).json({
      message: "Account created",
      refreshToken,
      accessToken,
      User: savedUserObject
    });
  } catch (error) {
    if(savedUser?._id){
      
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
