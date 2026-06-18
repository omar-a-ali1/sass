
const SECURITY_DEFAULTS = {
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Request-ID']
};

/**
 * Per-endpoint rate limit overrides.
 * Keyed by route path prefix, takes precedence over the global limit.
 * Set max to 0 to block the endpoint entirely.
 */
const RATE_LIMIT_CONFIG = {
  '/api/v1/auth/login':    { max: 5,  windowMs: 60 * 1000 },
  '/api/v1/auth/register': { max: 3,  windowMs: 60 * 1000 },
  '/api/v1/users':         { max: 60, windowMs: 60 * 1000 },
};

/**
 * Global middleware pipeline — order matters.
 * Each key maps to a middleware instantiated in bootstrap/index.js.
 */
const MIDDLEWARE_PIPELINE = [
  'favicon',
  'helmet',
  'cors',
  'cookieParser',
  'json',
  'urlencoded',
  'rateLimiter',
  'perfMonitor',
  'tracer',
  'injectServices',
  'responder',
  'activityLog',
];

/**
 * Performance monitoring configuration
 */
const PERF_MONITOR_CONFIG = {
  /** Enable /metrics endpoint */
  metricsEndpoint: true,
  /** Collect per-route breakdown */
  trackRoutes: true,
  /** Histogram bucket boundaries (ms) */
  histogramBuckets: [5, 10, 25, 50, 100, 250, 500, 1000, 3000, 5000, 10000],
};

/**
 * Swagger documentation metadata
 */
const SWAGGER_CONFIG = {
  title: 'SaaS Framework Custom Engine Architecture',
  version: '1.0.0',
  description: 'automated Open-API documentation layer compiled using centralized Mongoose & Joi Schemas.',
};

const HTTP_REQUESTS = {
  // 2xx Success
  200: {
    status: 'success',
    message: 'The request has succeeded.',
    log: 'OK - Request processed successfully.'
  },
  201: {
    status: 'success',
    message: 'Resource created successfully.',
    log: 'CREATED - New resource has been persisted.'
  },
  204: {
    status: 'success',
    message: 'Operation completed successfully.',
    log: 'NO_CONTENT - Request processed, no payload returned.'
  },

  300: {
    status: 'redirect',
    message: 'Multiple choices available.',
    log: 'MULTIPLE_CHOICES - Client must choose a redirection path.'
  },
  301: {
    status: 'redirect',
    message: 'The resource has been moved permanently.',
    log: 'MOVED_PERMANENTLY - Resource URL updated permanently.'
  },

  400: {
    status: 'fail',
    message: 'The data provided is invalid or corrupted.',
    log: 'BAD_REQUEST - Validation failed or malformed payload.'
  },
  401: {
    status: 'fail',
    message: 'Authentication is required to access this resource.',
    log: 'UNAUTHORIZED - Missing or invalid authentication token.'
  },
  403: {
    status: 'fail',
    message: 'You do not have permission to perform this action.',
    log: 'FORBIDDEN - User lacks necessary roles/permissions.'
  },
  404: {
    status: 'fail',
    message: 'The requested resource could not be found.',
    log: 'NOT_FOUND - Resource URL or ID does not exist.'
  },
  409: {
    status: 'fail',
    message: 'A conflict occurred. The resource might already exist.',
    log: 'CONFLICT - Resource state conflict (e.g., duplicate email).'
  },

  500: {
    status: 'error',
    message: 'An unexpected internal server error occurred.',
    log: 'INTERNAL_SERVER_ERROR - Uncaught exception or critical infrastructure crash.'
  },
  503: {
    status: 'error',
    message: 'The server is temporarily unavailable.',
    log: 'SERVICE_UNAVAILABLE - Server overloaded or down for maintenance.'
  }
};

module.exports = {
  SECURITY_DEFAULTS,
  RATE_LIMIT_CONFIG,
  HTTP_REQUESTS,
  MIDDLEWARE_PIPELINE,
  SWAGGER_CONFIG,
  PERF_MONITOR_CONFIG,
};