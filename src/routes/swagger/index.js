const components = require('./components');
const authPaths = require('./v1/auth.doc');

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'SaaS Framework Custom Engine Architecture',
    version: '1.0.0',
    description: 'Fully automated Open-API documentation layer compiled using centralized Joi Schemas.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Local Development Server'
    }
  ],
  paths: {
    ...authPaths
  },
  components: components
};