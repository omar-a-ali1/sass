/**
 * Database Connection Module
 *
 * Establishes a Mongoose connection to MongoDB using the URI from
 * the environment configuration. Exits the process on failure.
 *
 * @module config/database
 */

const mongoose = require('mongoose');
const env = require('./environment');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB
 *
 * Attempts to connect using `mongoose.connect()`. Logs success or
 * terminates the process with exit code 1 on failure.
 *
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.database.uri);
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

module.exports = connectDB;