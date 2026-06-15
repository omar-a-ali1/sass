const mongoose = require('mongoose');

const checkHealth = async (req, res, next) => {
  try {
    const env = process.env.NODE_ENV;
    const uptime = process.uptime();

    const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';

    const memoryUsage = process.memoryUsage();

    const healthStatus = {
      environment:env,
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