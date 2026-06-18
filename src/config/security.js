/**
 * Security Middleware Configuration
 *
 * Pre-configures Helmet (HTTP headers), rate limiting (express-rate-limit),
 * and CORS options using environment variables and system defaults.
 *
 * @module config/security
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./environment');
const { SECURITY_DEFAULTS } = require('./system');

/** Rate limiter: 15-minute window, max from env or defaults to 100 requests.
 *  Uses IP as the default key (express-rate-limit default). */
const limiter = rateLimit({
  windowMs: SECURITY_DEFAULTS.RATE_LIMIT_WINDOW_MS,
  max: env.rateLimit.max || SECURITY_DEFAULTS.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  /** Pre-configured Helmet middleware for secure HTTP headers */
  helmetConfig: helmet(),
  /** Rate-limiting middleware instance */
  rateLimiter: limiter,
  /** CORS configuration derived from env and security defaults */
  corsOptions: {
    origin: env.cors.origin,
    methods: SECURITY_DEFAULTS.CORS_METHODS,
    allowedHeaders: SECURITY_DEFAULTS.CORS_ALLOWED_HEADERS
  }
};