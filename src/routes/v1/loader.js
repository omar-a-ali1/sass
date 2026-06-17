/**
 * Recursive Route Loader
 *
 * Scans `src/routes/v1/` directories and builds an Express router
 * from route definition files. Each file exports a route config:
 *
 *   module.exports = {
 *     method: 'post',                     // HTTP method (required)
 *     path: '/login',                      // URL path relative to the dir (required)
 *     middleware: [rateLimiter, validate],  // Optional middleware array
 *     handler: controllerMethod,           // Route handler function (required)
 *     docs: { tags, summary, requestBody, responses }  // Optional Swagger doc
 *   };
 *
 * @module routes/v1/loader
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

/**
 * @typedef {Object} RouteDef
 * @property {string}   method     - HTTP method (lowercase)
 * @property {string}   path       - URL path (e.g. /auth/login)
 * @property {Function[]} middleware - Express middleware array
 * @property {Function} handler    - Route handler
 * @property {Object}   [docs]     - Optional Swagger/OpenAPI documentation
 * @property {Object}   [validationSchema] - Joi schema auto-detected from middleware
 */

/**
 * Recursively scan a directory and collect all route definitions
 *
 * @param {string} dir     - Directory to scan (absolute path)
 * @param {string} basePath - Accumulated URL prefix from parent directories
 * @returns {RouteDef[]}
 */
function collectRoutes(dir, basePath = '') {
  let routes = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      routes = routes.concat(collectRoutes(fullPath, `${basePath}/${entry.name}`));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      if (entry.name === 'index.js' || entry.name === 'loader.js') continue;

      const def = require(fullPath);
      if (!def || !def.method || !def.handler) continue;

      const middleware = Array.isArray(def.middleware) ? def.middleware : [];

      /** Auto-detect Joi validation schema from middleware chain */
      const validationSchema = middleware.find(
        (mw) => typeof mw === 'function' && mw._validationSchema
      )?._validationSchema || null;

      routes.push({
        method: def.method.toLowerCase(),
        path: `${basePath}${def.path || `/${path.basename(entry.name, '.js')}`}`,
        middleware,
        handler: def.handler,
        docs: def.docs || null,
        validationSchema,
      });
    }
  }

  return routes;
}

/**
 * Build an Express router from route definitions in the given directory
 *
 * @param {string} dir - Directory to scan (defaults to __dirname)
 * @returns {import('express').Router}
 */
function buildRouter(dir = __dirname) {
  const router = express.Router();
  const routes = collectRoutes(dir);

  for (const route of routes) {
    if (typeof router[route.method] === 'function') {
      router[route.method](route.path, ...route.middleware, route.handler);
    }
  }

  return router;
}

module.exports = { collectRoutes, buildRouter };
