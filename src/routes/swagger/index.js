/**
 * OpenAPI Root Document
 *
 * Assembles the complete OpenAPI 3.0 specification for the framework.
 * Paths are generated per-module, components (schemas, responses,
 * security schemes) are composed from shared definitions, and
 * request/response schemas are auto-generated from Joi validators
 * via `joi-to-swagger`.
 *
 * @module routes/swagger/index
 */

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