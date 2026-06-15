const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./environment');
const { SECURITY_DEFAULTS } = require('../constants/system');

const limiter = rateLimit({
  windowMs: SECURITY_DEFAULTS.RATE_LIMIT_WINDOW_MS,
  max: env.rateLimit.max || SECURITY_DEFAULTS.RATE_LIMIT_MAX_REQUESTS, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  helmetConfig: helmet(),
  rateLimiter: limiter,
  corsOptions: {
    origin: env.cors.origin,
    methods: SECURITY_DEFAULTS.CORS_METHODS,
    allowedHeaders: SECURITY_DEFAULTS.CORS_ALLOWED_HEADERS
  }
};