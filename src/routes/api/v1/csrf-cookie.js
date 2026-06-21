const { setCsrfCookie } = require('../../../middlewares/csrf');

module.exports = {
  method: 'get',
  path: '/csrf-cookie',
  handler: (req, res) => {
    setCsrfCookie(req, res);
    return res.status(204).send();
  },
  docs: {
    tags: ['CSRF'],
    summary: 'Get CSRF token cookie',
    description: 'Sets the csrf-token cookie required for state-changing requests when using cookie-based auth.',
    responses: {
      204: { description: 'CSRF cookie set' },
    }
  }
};