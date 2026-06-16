/**
 * Environment Configuration Module
 *
 * Loads environment-specific `.env.{NODE_ENV}` files using dotenv.
 * In production, validates that critical environment variables are defined.
 * Exports a typed configuration object consumed by the entire framework.
 *
 * @module config/environment
 */

const dotenv = require('dotenv');
const path = require('path');

const envType = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${envType}`),
  override: true
});

if (envType === 'production') {
  const criticalKeys = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN'];
  criticalKeys.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`[CRITICAL CONFIG ERROR]: Missing environment variable [${key}] in production!`);
    }
  });
}

/** Application-wide configuration object */
module.exports = {
  /** Current runtime environment (development, production, test) */
  env: envType,
  /** HTTP server port */
  port: parseInt(process.env.PORT, 10) || 3000,

  database: {
    /** Database driver (currently only 'mongo' is implemented) */
    driver: process.env.DB_DRIVER || 'mongo',
    /** Database connection URI */
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/myapp_dev',
  },
  bcrypt: {
    /** Number of bcrypt salt rounds for password hashing */
    salt: parseInt(process.env.BCRPT_SALT_SIZE, 10),
  },
  jwt: {
    /** Secret key used to sign access tokens */
    secret: process.env.JWT_SECRET,
    /** Access token expiration duration (e.g. '15m', '1d') */
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    /** Secret key used to sign refresh tokens */
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    /** Refresh token expiration duration (e.g. '7d', '30d') */
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    /** Allowed CORS origin(s) */
    origin: process.env.CORS_ORIGIN || '*',
  },

  rateLimit: {
    /** Maximum number of requests per rate-limit window */
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || null,
  },

  storage: {
    /** Storage driver ('local' or 's3') */
    driver: process.env.STORAGE_DRIVER || 'local',
    /** Local upload directory (relative to project root) */
    uploadDir: process.env.STORAGE_LOCAL_PATH || 'storage/uploads',
    /** Public URL prefix for local files */
    baseUrl: process.env.STORAGE_LOCAL_URL || '/uploads',
    /** S3 bucket name (used when driver is 's3') */
    s3Bucket: process.env.S3_BUCKET || '',
    /** S3 region (used when driver is 's3') */
    s3Region: process.env.S3_REGION || '',
  },
};