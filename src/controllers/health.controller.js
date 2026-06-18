/**
 * Health Controller
 *
 * Provides a system health-check endpoint that reports environment,
 * database connectivity, uptime, and memory usage.
 *
 * @module controllers/health.controller
 */

const mongoose = require('mongoose');
const config = require('../config/environment');

const _checkPostgres = async () => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: config.database.pgUri, max: 1, connectionTimeoutMillis: 3000 });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
    return 'UP';
  } catch {
    return 'DOWN';
  }
};

const checkHealth = async (req, res, next) => {
  try {
    const env = process.env.NODE_ENV;
    const uptime = process.uptime();

    let dbStatus;
    if (config.database.driver === 'postgres') {
      dbStatus = await _checkPostgres();
    } else {
      dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    }

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