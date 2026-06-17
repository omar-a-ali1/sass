/**
 * Swagger Docs Auto-Generator
 *
 * Generates OpenAPI path documentation from route definition files
 * using their `docs` exports and auto-detected Joi schemas.
 *
 * @module bootstrap/loadSwagger
 */

const j2s = require('joi-to-swagger');
const path = require('path');
const { collectRoutes } = require('./loadRoutes');

/**
 * Build an OpenAPI requestBody from a Joi schema
 *
 * @param {import('joi').ObjectSchema} schema
 * @returns {Object}
 */
function requestBodyFromSchema(schema) {
  const { swagger } = j2s(schema);
  return {
    required: true,
    content: {
      'application/json': { schema: swagger },
    },
  };
}

/**
 * Build default response set for a route
 *
 * @param {Object} route
 * @returns {Object}
 */
function defaultResponses(route) {
  const successCode = route.method === 'post' ? 201 : 200;
  const successDesc = route.method.toUpperCase() === 'POST'
    ? 'Resource created successfully'
    : 'Request completed successfully';

  return {
    [successCode]: { description: successDesc },
    400: { $ref: '#/components/responses/ValidationError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  };
}

/**
 * Derive a tag from the route path (first segment)
 *
 * @param {string} routePath
 * @returns {string}
 */
function deriveTag(routePath) {
  const segment = routePath.split('/').filter(Boolean)[0];
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Default';
}

/**
 * Generate OpenAPI paths from route definitions
 *
 * @param {Object}  [options]
 * @param {string}  [options.routesDir]
 * @param {Object}  [options.manualPaths]
 * @returns {Object} OpenAPI paths object
 */
function generatePaths(options = {}) {
  const routesDir = options.routesDir || path.join(__dirname, '..', 'routes', 'api');
  const routes = collectRoutes(routesDir);
  const paths = { ...(options.manualPaths || {}) };

  for (const route of routes) {
    const openapiPath = route.path;
    const tag = deriveTag(route.path);

    if (!paths[openapiPath]) {
      paths[openapiPath] = {};
    }

    const docs = route.docs || {};

    const requestBody = docs.requestBody
      || (route.validationSchema ? requestBodyFromSchema(route.validationSchema) : undefined);

    paths[openapiPath][route.method] = {
      tags: docs.tags || [tag],
      summary: docs.summary || `${route.method.toUpperCase()} ${route.path}`,
      description: docs.description || '',
      ...(requestBody ? { requestBody } : {}),
      responses: docs.responses || defaultResponses(route),
    };
  }

  return paths;
}

module.exports = { generatePaths };
