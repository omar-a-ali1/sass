/**
 * Health Check Routes
 *
 * Provides a single endpoint for monitoring system health.
 * Delegates to the health controller for DB status and metrics.
 *
 * @module routes/health
 */

const express = require('express');
const { checkHealth } = require('../controllers/health.controller');
const { collectSnapshot } = require('../middlewares/perfMonitor');
const { PERF_MONITOR_CONFIG } = require('../config/system');

const router = express.Router();

/** GET /health — returns system status, DB health, uptime, memory */
router.get('/', checkHealth);

/** GET /metrics — returns performance metrics snapshot */
if (PERF_MONITOR_CONFIG.metricsEndpoint) {
  router.get('/metrics', (req, res) => {
    const metrics = req.app.locals.metrics;
    if (!metrics) {
      return res.json({ uptime: 0, requests: { total: 0 }, histogram: {}, system: {} });
    }
    res.json(collectSnapshot(metrics));
  });
}

module.exports = router;