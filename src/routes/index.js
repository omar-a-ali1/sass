const config = require('../config/environment');

module.exports = {
  method: 'get',
  path: '/',
  handler: (req, res) => {
    if (config.env === 'development') {
      const { cachedRoutes } = require('../bootstrap/loadRoutes');
      const routes = cachedRoutes.map((r) => ({
        method: r.method.toUpperCase(),
        path: r.path,
        handler: r.handler.name || '(anonymous)',
        middleware: r.middleware.map((m) => m._label || m.name || '(anonymous)'),
      }));

      return res.json({
        message: 'SASS Framework',
        environment: config.env,
        _links: {
          health: '/health',
          metrics: '/health/metrics',
          docs: '/api-docs',
        },
        endpoints: routes,
        total: routes.length,
      });
    }

    res.json({ message: 'SASS work !' });
  },
  docs: {
    tags: ['Dev'],
    summary: 'List available API endpoints',
    description: 'In development mode returns all registered routes. In production returns a simple status message.',
    responses: {
      200: { description: 'OK' },
    },
  },
};
