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

module.exports = {
  env: envType,
  port: parseInt(process.env.PORT, 10) || 3000,
  
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/myapp_dev',
  },
  bcrypt: {
    salt : parseInt(process.env.BCRPT_SALT_SIZE, 10) ,
    
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || null, 
  }
};