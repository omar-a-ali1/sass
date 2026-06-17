/**
 * Per-Route Rate Limiter Middleware Factory
 *
 * Creates configurable rate-limiter instances for individual routes.
 * Each route can define its own window and request limit independent
 * of the global rate limiter.
 *
 * Usage:
 *   router.post('/login', createRateLimiter({ max: 5 }), handler);
 *
 * @module middlewares/rateLimiter
 */

const rateLimit = require('express-rate-limit');

/**
 * Create a rate limiter middleware with the given options
 *
 * @param {Object}   [options]                     - Rate limiter configuration
 * @param {number}   [options.windowMs=60000]      - Time window in milliseconds (default: 1 minute)
 * @param {number}   [options.max=10]               - Max requests per window
 * @param {string}   [options.message]              - Custom error message
 * @param {boolean}  [options.standardHeaders=true] - Return rate limit info in headers
 * @param {boolean}  [options.legacyHeaders=false]  - Omit legacy X-RateLimit-* headers
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 10,
    message = 'Too many requests, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  const mw = rateLimit({
    windowMs,
    max,
    message: { success: false, status: 'fail', error: { message } },
    standardHeaders,
    legacyHeaders,
    validate: { xForwardedForHeader: false },
  });

  mw._label = `rateLimiter({ max: ${max}, windowMs: ${windowMs} })`;
  return mw;
};

module.exports = createRateLimiter;
