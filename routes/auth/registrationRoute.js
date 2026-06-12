import express from "express";
import bcrypt from "bcrypt";
import userModel from "../../database/schema/authSchema/userSchema.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import tokenModel from "../../database/schema/authSchema/tokenSchema.js";

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

  try {
    const emailExists = await userModel.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      return res.status(500).json({ error: "Password processing failed" });
    }
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
    let savedUser;
    let refreshToken;

    savedUser = await userModel.create(user);
    refreshToken = jwt.sign(
      { tokenId:storeToken._id,userId: savedUser._id, email, type: "refresh" },
      process.env.JWT_REFRESH,
      { expiresIn: "7d" },
    );

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const jsonToken = {
      userId: savedUser._id,
      token: hashedToken,
      type: "refresh",
      createdAt: new Date(),
      expiresIn: expiresAt,
    };
    let isTokenCreated = await tokenModel.create(jsonToken);
    if (!isTokenCreated)
      return res.status(500).json({ error: "couldnt create" });
    const accessToken = jwt.sign(
      {
        userId: savedUser._id,
        email: email,
        type: "access",
      },
      process.env.JWT_ACCESS,
      { expiresIn: "5m" },
    );
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    res.status(201).json({
      message: "Account created",
      refreshToken,
      accessToken,
      User: savedUser
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
