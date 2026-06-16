/**
 * Health Controller
 *
 * Provides a system health-check endpoint that reports environment,
 * database connectivity, uptime, and memory usage.
 *
 * @module controllers/health.controller
 */

const mongoose = require('mongoose');

/**
 * Check system health
 *
 * GET /health
 * Returns environment details, database status (UP/DOWN),
 * server uptime, and heap memory usage.
 *
 * @async
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const checkHealth = async (req, res, next) => {
  try {
    const env = process.env.NODE_ENV;
    const uptime = process.uptime();

    const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';

    const memoryUsage = process.memoryUsage();

    const healthStatus = {
      environment: env,
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)} seconds`,
      services: {
        database: dbStatus,
      },
      system: {
        memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      }
    };

    if (dbStatus === 'DOWN') {
      healthStatus.status = 'DOWN';
      return res.status(503).json({ success: false, ...healthStatus });
    }

    return res.status(200).json({ success: true, ...healthStatus });

  } catch (error) {
    next(error);
  }
};

module.exports = { checkHealth };