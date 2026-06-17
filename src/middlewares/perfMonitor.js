/**
 * Performance Monitoring Middleware
 *
 * Tracks HTTP request metrics:
 *  - Request count by route and method
 *  - Response time distribution (histogram buckets)
 *  - Status code counts
 *  - System-level memory and CPU usage sampled on each request
 *
 * Metrics are available at `GET /metrics` (registered as a separate route)
 * and attached to `req.app.locals.metrics` for programmatic access.
 *
 * @module middlewares/perfMonitor
 */

const os = require('os');

/**
 * Bucket boundaries for response time histogram (in milliseconds)
 */
const BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 3000, 5000, 10000];

/**
 * Initialise a fresh metrics snapshot
 *
 * @returns {Object} Empty metrics store
 */
function createMetrics() {
  return {
    /** Total requests received since process start */
    totalRequests: 0,
    /** Requests grouped by HTTP method */
    byMethod: {},
    /** Requests grouped by route pattern (e.g. `/auth/login`) */
    byRoute: {},
    /** Requests grouped by status code range (2xx, 4xx, 5xx) */
    byStatus: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    /** Response time histogram: bucket -> count */
    histogram: Object.fromEntries(BUCKETS.map((b) => [b, 0])),
    /** Sum of all response times for calculating average */
    totalResponseTime: 0,
    /** System snapshot taken at startup */
    startTime: Date.now(),
    startCpu: process.cpuUsage(),
  };
}

/**
 * Express middleware that collects per-request metrics.
 *
 * Must be mounted before routes to intercept all requests.
 *
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Next middleware function
 */
function perfMonitor(req, res, next) {
  const metrics = req.app.locals.metrics || (req.app.locals.metrics = createMetrics());
  const start = Date.now();

  metrics.totalRequests += 1;

  const method = req.method;
  metrics.byMethod[method] = (metrics.byMethod[method] || 0) + 1;

  /** Normalise route pattern — use Express' route path if available, fallback to URL */
  const routePattern = req.route ? req.route.path : (req.basePath || req.path || req.url);
  if (!metrics.byRoute[routePattern]) {
    metrics.byRoute[routePattern] = { count: 0, totalTime: 0 };
  }
  metrics.byRoute[routePattern].count += 1;

  /** Capture original end to intercept response */
  const originalEnd = res.end.bind(res);
  const startTime = start;

  res.end = function (...args) {
    const duration = Date.now() - startTime;

    /** Status code range */
    const statusCode = res.statusCode || 500;
    const range = `${String(statusCode)[0]}xx`;
    if (metrics.byStatus[range] !== undefined) {
      metrics.byStatus[range] += 1;
    }

    /** Histogram bucket */
    for (let i = BUCKETS.length - 1; i >= 0; i--) {
      if (duration <= BUCKETS[i]) {
        metrics.histogram[BUCKETS[i]] += 1;
        break;
      }
    }

    metrics.totalResponseTime += duration;
    metrics.byRoute[routePattern].totalTime += duration;

    return originalEnd(...args);
  };

  next();
}

/**
 * Build a metrics summary payload
 *
 * @param {Object} metrics - Raw metrics store
 * @returns {Object} Human-readable metrics
 */
function collectSnapshot(metrics) {
  const now = Date.now();
  const elapsed = (now - metrics.startTime) / 1000;
  const cpuNow = process.cpuUsage(metrics.startCpu);

  return {
    uptime: Math.floor(elapsed),
    requests: {
      total: metrics.totalRequests,
      byMethod: metrics.byMethod,
      byRoute: Object.fromEntries(
        Object.entries(metrics.byRoute).map(([route, data]) => [
          route,
          { count: data.count, avgMs: data.count ? Math.round((data.totalTime / data.count) * 100) / 100 : 0 },
        ])
      ),
      byStatus: metrics.byStatus,
      avgResponseMs: metrics.totalRequests
        ? Math.round((metrics.totalResponseTime / metrics.totalRequests) * 100) / 100
        : 0,
    },
    histogram: metrics.histogram,
    system: {
      memory: process.memoryUsage(),
      loadAvg: os.loadavg(),
      cpuUser: Math.round(cpuNow.user / 1000),
      cpuSystem: Math.round(cpuNow.system / 1000),
    },
  };
}

module.exports = { perfMonitor, collectSnapshot, createMetrics };
