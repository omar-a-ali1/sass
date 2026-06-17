/**
 * Swagger Documentation Auto-Loader
 *
 * Scans all route definition files via `collectRoutes` and auto-generates
 * OpenAPI path documentation. Each route file can optionally export a
 * `docs` property for full customization. When docs are omitted, sensible
 * defaults are used.
 *
 * Manual path overrides can be passed to merge with auto-generated docs.
 *
 * @module routes/swagger/loader
 */

const { collectRoutes } = require('../v1/loader');
const j2s = require('joi-to-swagger');
const path = require('path');

/**
 * Build an OpenAPI requestBody from a Joi schema
 *
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @returns {Object} OpenAPI requestBody object
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
 * Build a default response set for a route
 *
 * @param {Object} route - Route definition
 * @returns {Object} OpenAPI responses object
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
 * Derive a tag name from the route path (first path segment)
 *
 * @param {string} routePath - e.g. /auth/login
 * @returns {string}
 */
function deriveTag(routePath) {
  const segment = routePath.split('/').filter(Boolean)[0];
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Default';
}

/**
 * Auto-generate OpenAPI paths from route definitions, merged with
 * any manual path overrides.
 *
 * @param {Object}  [options]
 * @param {string}  [options.routesDir]      - Directory to scan for routes (default: v1 directory)
 * @param {Object}  [options.manualPaths]    - Additional or overriding path definitions
 * @returns {Object} OpenAPI paths object
 */
function generatePaths(options = {}) {
  const routesDir = options.routesDir || path.join(__dirname, '..', 'v1');
  const routes = collectRoutes(routesDir);
  const paths = { ...(options.manualPaths || {}) };

  for (const route of routes) {
    const openapiPath = route.path;
    const tag = deriveTag(route.path);

    if (!paths[openapiPath]) {
      paths[openapiPath] = {};
    }

    const docs = route.docs || {};

    /** Auto-generate requestBody from Joi schema when docs don't provide one */
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
