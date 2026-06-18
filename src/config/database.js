const mongoose = require('mongoose');
const env = require('./environment');
const logger = require('../utils/logger');

const connectDB = async (container) => {
  const driver = env.database.driver;

  if (driver === 'postgres') {
    logger.info('PostgreSQL driver selected — verifying connection...');
    if (container) {
      const dbStrategy = container.get('dbStrategy');
      const ok = await dbStrategy.verify();
      if (!ok) {
        throw new Error('PostgreSQL connection verification failed');
      }
      logger.info('PostgreSQL connection verified successfully.');
    }
    return;
  }

  try {
    await mongoose.connect(env.database.uri);
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

module.exports = connectDB;
