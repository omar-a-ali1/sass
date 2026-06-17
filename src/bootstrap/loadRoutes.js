/**
 * Route Auto-Loader
 *
 * Recursively scans a route directory and builds an Express router
 * from route definition files. Each file exports:
 *
 *   module.exports = {
 *     method,        // HTTP method (required)
 *     path,          // URL path relative to the dir (required)
 *     middleware[],  // Optional middleware
 *     handler,       // Route handler (required)
 *     docs           // Optional Swagger doc
 *   };
 *
 * @module bootstrap/loadRoutes
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

/**
 * @typedef {Object} RouteDef
 * @property {string}   method
 * @property {string}   path
 * @property {Function[]} middleware
 * @property {Function} handler
 * @property {Object}   [docs]
 * @property {Object}   [validationSchema]
 */

/**
 * Recursively scan a directory and collect route definitions
 *
 * @param {string} dir      - Directory to scan
 * @param {string} basePath - Accumulated URL prefix
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
      const def = require(fullPath);
      if (!def || !def.method || !def.handler) continue;

      const middleware = Array.isArray(def.middleware) ? def.middleware : [];

      /** Auto-detect Joi validation schema from middleware chain */
      const validationSchema = middleware.find(
        (mw) => typeof mw === 'function' && mw._validationSchema
      )?._validationSchema || null;

      /** Auto-detect Joi query validation schema from middleware chain */
      const querySchema = middleware.find(
        (mw) => typeof mw === 'function' && mw._queryValidationSchema
      )?._queryValidationSchema || null;

      routes.push({
        method: def.method.toLowerCase(),
        path: `${basePath}${def.path || `/${path.basename(entry.name, '.js')}`}`,
        middleware,
        handler: def.handler,
        docs: def.docs || null,
        validationSchema,
        querySchema,
      });
    }
  }

  return routes;
}

/**
 * Build an Express router from route definitions in the given directory
 *
 * @param {string} dir - Directory to scan
 * @returns {import('express').Router}
 */
function buildRouter(dir) {
  const router = express.Router();
  const routes = collectRoutes(dir);

  for (const route of routes) {
    if (typeof router[route.method] === 'function') {
      router[route.method](route.path, ...route.middleware, route.handler);
    }
  }

  return router;
}

const env = require('../config/environment');

const routesDir = path.join(__dirname, '..', 'routes', env.routePrefix.replace(/^\//, ''));

/** Pre-built  router — auto-loaded at import time */
const Router = buildRouter(routesDir);

module.exports = { collectRoutes, buildRouter, Router, routePrefix: env.routePrefix };
