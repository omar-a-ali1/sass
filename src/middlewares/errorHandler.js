const logger = require('../utils/logger');
const { HTTP_REQUESTS } = require('../constants/system');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  const config = HTTP_REQUESTS[statusCode] || HTTP_REQUESTS[500];
  const message = err.message || config.message;

  
  if (statusCode >= 400 && statusCode < 500) {
    logger.warn(`${config.log} -> Path: ${req.originalUrl}`, {
      traceId: req.id,
      fields: err.fields || null
    });
  }

  
  if (statusCode >= 500) {
    logger.error(`${config.log} - ${message}`, {
      traceId: req.id,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      stack: err.stack
    });
  }
  
  res.status(statusCode).json({
    success: false,
    status: config.status,
    traceId: req.id,
    error: {
      message: message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      fields: err.fields || undefined
    }
  });
};

module.exports = errorHandler;