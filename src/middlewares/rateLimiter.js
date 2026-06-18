const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_CONFIG } = require('../config/system');

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

const createConfigDrivenRateLimiter = (routePath, options = {}) => {
  const config = RATE_LIMIT_CONFIG[routePath];
  if (!config) return null;
  return createRateLimiter({ ...config, ...options });
};

module.exports = createRateLimiter;
module.exports.createConfigDrivenRateLimiter = createConfigDrivenRateLimiter;
