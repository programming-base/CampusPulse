import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  // Set JWT secrets for testing
  process.env.JWT_ACCESS = 'test-access-secret-key-for-jest';
  process.env.JWT_REFRESH = 'test-refresh-secret-key-for-jest';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-jest';
  process.env.JWT_ACEESS = process.env.JWT_ACCESS; // Typo in resetPassword.js

  // Cloudinary env vars (routes import cloudinary.js which calls cloudinary.config)
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-api-key';
  process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

  // SMTP env vars to prevent nodemailer from calling createTestAccount (HTTP request)
  process.env.SMTP_HOST = 'smtp.ethereal.email';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'test@ethereal.email';
  process.env.SMTP_PASS = 'testpassword';
  process.env.SMTP_FROM = '"CampusPulse Test" <test@campuspulse.local>';

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Disconnect any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear all collections before each test for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
