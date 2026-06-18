const j2s = require('joi-to-swagger');
const path = require('path');
const { collectRoutes } = require('./loadRoutes');

function requestBodyFromSchema(schema) {
  const { swagger } = j2s(schema);
  return {
    required: true,
    content: {
      'application/json': { schema: swagger },
    },
  };
}

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

function requiresAuth(middleware) {
  return middleware.some((mw) => typeof mw === 'function' && mw.name === 'authenticate');
}

const DEFAULT_RESPONSE_CODES = {
  '200': '#/components/responses/SuccessResponse',
  '201': '#/components/responses/CreatedResponse',
  '400': '#/components/responses/ValidationError',
  '401': '#/components/responses/UnauthorizedError',
  '403': '#/components/responses/ForbiddenError',
  '404': '#/components/responses/NotFoundError',
  '409': '#/components/responses/ConflictError',
  '500': '#/components/responses/InternalServerError',
};

const METHOD_TO_SUCCESS = {
  post:   { code: '201', desc: 'Resource created successfully' },
  get:    { code: '200', desc: 'Request completed successfully' },
  put:    { code: '200', desc: 'Resource updated successfully' },
  patch:  { code: '200', desc: 'Resource updated successfully' },
  delete: { code: '200', desc: 'Resource deleted successfully' },
};

function pickSuccessDefault(route) {
  const docs = route.docs || {};
  const userCodes = docs.responses || {};
  const user2xx = Object.keys(userCodes).find(c => c.startsWith('2'));
  if (user2xx) {
    return { [user2xx]: { description: userCodes[user2xx].description || '' } };
  }
  const success = METHOD_TO_SUCCESS[route.method] || METHOD_TO_SUCCESS.get;
  return { [success.code]: { description: success.desc } };
}

function mergeResponses(routeDefaults, userResponses) {
  if (!userResponses) return routeDefaults;
  const merged = { ...routeDefaults };
  for (const [code, response] of Object.entries(userResponses)) {
    merged[code] = response;
  }
  return merged;
}

function applyStandardErrorRefs(responses, route) {
  if (!('400' in responses)) responses['400'] = { $ref: DEFAULT_RESPONSE_CODES['400'] };
  if (!('500' in responses)) responses['500'] = { $ref: DEFAULT_RESPONSE_CODES['500'] };
  if (requiresAuth(route.middleware)) {
    if (!('401' in responses)) responses['401'] = { $ref: DEFAULT_RESPONSE_CODES['401'] };
    if (!('403' in responses)) responses['403'] = { $ref: DEFAULT_RESPONSE_CODES['403'] };
  }
  return responses;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Default';
}

function deriveTag(folderName) {
  return capitalize(folderName);
}

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

    const responses = applyStandardErrorRefs(
      mergeResponses(pickSuccessDefault(route), docs.responses),
      route
    );

    paths[openapiPath][route.method] = {
      tags: docs.tags || [tag],
      summary: docs.summary || `${route.method.toUpperCase()} ${route.path}`,
      description: docs.description || '',
      ...(parameters.length ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      ...(security ? { security } : {}),
      responses,
    };
  }

  return paths;
}

module.exports = { generatePaths };
