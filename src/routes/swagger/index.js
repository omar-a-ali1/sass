/**
 * OpenAPI Root Document
 *
 * Assembles the complete OpenAPI 3.0 specification for the framework.
 * Paths are auto-generated from route definition files via the swagger
 * loader. Components (schemas, responses, security schemes) are composed
 * from shared definitions, with request/response schemas auto-generated
 * from Joi validators via `joi-to-swagger`.
 *
 * @module routes/swagger/index
 */

const components = require('./components');
const { generatePaths } = require('./loader');

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
  paths: generatePaths(),
  components: components
};