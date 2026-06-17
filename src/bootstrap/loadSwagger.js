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
 * Convert a Joi query schema to OpenAPI query parameters
 *
 * Takes a Joi object schema and transforms each property into
 * `{ name, in: 'query', schema, description, required }`.
 *
 * @param {import('joi').ObjectSchema} schema
 * @returns {Object[]}
 */
function querySchemaToParameters(schema) {
  const { swagger } = j2s(schema);
  const required = new Set(swagger.required || []);

  return Object.entries(swagger.properties || {}).map(([name, prop]) => ({
    name,
    in: 'query',
    description: prop.description || '',
    required: required.has(name),
    schema: { ...prop, description: undefined },
  }));
}

/**
 * Extract OpenAPI path parameters from an Express-style path
 *
 * Converts `:id` and `:userId` segments into
 * `{ name, in: 'path', required: true, schema: { type: 'string' } }`.
 *
 * @param {string} routePath - e.g. '/v1/users/:id'
 * @returns {Object[]}
 */
function extractPathParams(routePath) {
  const params = [];
  const regex = /:(\w+)/g;
  let match;
  while ((match = regex.exec(routePath)) !== null) {
    params.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    });
  }
  return params;
}

/**
 * Check if a route uses authenticate middleware
 *
 * @param {Object[]} middleware - Array of middleware functions
 * @returns {boolean}
 */
function requiresAuth(middleware) {
  return middleware.some((mw) => typeof mw === 'function' && mw.name === 'authenticate');
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
 * Capitalize the first letter of a string
 *
 * @param {string} s
 * @returns {string}
 */
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Default';
}

/**
 * Derive a Swagger tag from the parent folder name
 *
 * @param {string} folderName
 * @returns {string}
 */
function deriveTag(folderName) {
  return capitalize(folderName);
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
  const routesDir = options.routesDir || path.join(__dirname, '..', 'routes');
  const routes = collectRoutes(routesDir);
  const paths = { ...(options.manualPaths || {}) };

  for (const route of routes) {
    const openapiPath = route.path.replace(/:(\w+)/g, '{$1}');
    const tag = deriveTag(route.tag);

    if (!paths[openapiPath]) {
      paths[openapiPath] = {};
    }

    const docs = route.docs || {};

    const requestBody = docs.requestBody
      || (route.validationSchema ? requestBodyFromSchema(route.validationSchema) : undefined);

    const parameters = [
      ...extractPathParams(route.path),
      ...(route.querySchema ? querySchemaToParameters(route.querySchema) : []),
      ...(docs.parameters || []),
    ];

    const security = requiresAuth(route.middleware)
      ? [{ bearerAuth: [] }, { cookieAuth: [] }]
      : undefined;

    paths[openapiPath][route.method] = {
      tags: docs.tags || [tag],
      summary: docs.summary || `${route.method.toUpperCase()} ${route.path}`,
      description: docs.description || '',
      ...(parameters.length ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      ...(security ? { security } : {}),
      responses: docs.responses || defaultResponses(route),
    };
  }

  return paths;
}

module.exports = { generatePaths };
