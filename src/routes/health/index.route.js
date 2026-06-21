const { checkHealth } = require('../../controllers/health.controller');

module.exports = {
  method: 'get',
  path: '/',
  handler: checkHealth,
  docs: {
    tags: ['Health'],
    summary: 'System health check',
    description: 'Returns system status, DB health, uptime, memory usage.',
    responses: {
      200: { description: 'System is healthy' },
      503: { $ref: '#/components/responses/ServiceUnavailableError' },
    },
  },
};
