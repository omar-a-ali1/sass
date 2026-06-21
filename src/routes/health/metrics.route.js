const { collectSnapshot } = require('../../middlewares/perfMonitor');
const { PERF_MONITOR_CONFIG } = require('../../config/system');

const metrics = async (req, res) => {
  const m = req.app.locals.metrics;
  if (!m) {
    return res.json({ uptime: 0, requests: { total: 0 }, histogram: {}, system: {} });
  }
  res.json(collectSnapshot(m));
};

module.exports = PERF_MONITOR_CONFIG.metricsEndpoint
  ? {
      method: 'get',
      path: '/metrics',
      handler: metrics,
      docs: {
        tags: ['Health'],
        summary: 'Performance metrics',
        description: 'Returns request count, histogram, latency, and system memory snapshot.',
        responses: {
          200: { description: 'Metrics snapshot' },
        },
      },
    }
  : null;
