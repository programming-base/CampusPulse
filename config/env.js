import 'dotenv/config';

const env = {
  get PORT() {
    return process.env.PORT || 3000;
  },
  get MONGODB_URL() {
    return process.env.MONGODB_URL || 'mongodb://localhost:27017/mydb';
  },
  JWT: {
    get ACCESS() {
      return process.env.JWT_ACCESS || 'default_access_secret';
    },
    get REFRESH() {
      return process.env.JWT_REFRESH || 'default_refresh_secret';
    },
    get SECRET() {
      return process.env.JWT_SECRET || process.env.JWT_ACCESS || 'default_secret';
    },
  },
  CLOUDINARY: {
    get CLOUD_NAME() {
      return process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || process.env.CLOUD_SECRET || '';
    },
    get API_KEY() {
      return process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY || '';
    },
    get API_SECRET() {
      return process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET || '';
    },
  },
  SMTP: {
    get HOST() {
      return process.env.SMTP_HOST || 'smtp.ethereal.email';
    },
    get PORT() {
      return Number(process.env.SMTP_PORT) || 587;
    },
    get SECURE() {
      return process.env.SMTP_SECURE === 'true';
    },
    get USER() {
      return process.env.SMTP_USER || '';
    },
    get PASS() {
      return process.env.SMTP_PASS || '';
    },
    get FROM() {
      return process.env.SMTP_FROM || '"CampusPulse" <no-reply@campuspulse.local>';
    },
  },
};

export default env;