/**
 * Global Error Handler Middleware
 *
 * Catches all errors propagated via `next(err)` and returns a
 * consistent JSON error response. Logs 4xx errors as warnings
 * and 5xx errors (with full stack trace) as errors.
 *
 * @module middlewares/errorHandler
 */

const logger = require('../utils/logger');
const { HTTP_REQUESTS } = require('../config/system');

/**
 * Express error-handling middleware (4 arguments)
 *
 * @param {Error}  err  - The error object (expected to have statusCode, fields)
 * @param {Object} req  - Express request object
 * @param {Object} res  - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const config = HTTP_REQUESTS[statusCode] || HTTP_REQUESTS[500];
  const message = err.message || config.message;

  // trace warning {user errors }
  if (statusCode >= 400 && statusCode < 500) {
    logger.warn(`${config.log} -> Path: ${req.originalUrl}`, {
      traceId: req.id,
      fields: err.fields || null
    });
  }
  // trace error {server errors}
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
      // return stack if local and hide it in prod
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      fields: err.fields || undefined
    }
  });
};

module.exports = errorHandler;