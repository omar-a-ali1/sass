/**
 * Request Tracer Middleware
 *
 * Assigns a unique request ID to every incoming HTTP request
 * (from the `X-Request-ID` header or a random UUID segment),
 * sets the `X-Request-ID` response header, and logs HTTP
 * request details via Morgan piped through Winston.
 *
 * @module middlewares/tracer
 */

const crypto = require('crypto')
const morgan = require('morgan')
const logger = require('../lib/utils/logger')

/** Register a custom Morgan token for the request ID */
morgan.token('id', (req) => req.id);

/**
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Next middleware function
 */
const tracerMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID().split('-')[0];

  res.setHeader('X-Request-ID', req.id);

  const morganInstance = morgan(
    '[:id] :method :url :status :res[content-length] - :response-time ms',
    { stream: { write: (message) => logger.http(message.trim()) } }
  );

  morganInstance(req, res, next);
};

module.exports = tracerMiddleware;