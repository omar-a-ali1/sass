const fs = require('fs');
const path = require('path');
const express = require('express');
const createRateLimiter = require('../middlewares/rateLimiter');

const routesDir = path.join(__dirname, '..', 'routes');

function collectRoutes(dir = routesDir, basePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === '__tests__') continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...collectRoutes(fullPath, `${basePath}/${entry.name}`));
    } else if (entry.isFile() && entry.name.endsWith('.route.js')) {
      const def = require(fullPath);
      if (!def || !def.method || !def.handler) continue;
      const p = def.path || `/${path.basename(entry.name, '.js')}`;

      let middleware = Array.isArray(def.middleware) ? [...def.middleware] : [];

      if (def.rateLimit) {
        const rlMw = createRateLimiter(def.rateLimit);
        rlMw._label = `rateLimit(${JSON.stringify(def.rateLimit)})`;
        middleware = [rlMw, ...middleware];
      }

      const validationSchema = middleware.find(
        (mw) => typeof mw === 'function' && mw._validationSchema
      )?._validationSchema || null;

      const querySchema = middleware.find(
        (mw) => typeof mw === 'function' && mw._queryValidationSchema
      )?._queryValidationSchema || null;

      const tag = path.basename(dir);

      routes.push({
        method: def.method.toLowerCase(),
        path: `${basePath}${p}`,
        middleware,
        handler: def.handler,
        docs: def.docs || null,
        validationSchema,
        querySchema,
        tag,
      });
    }
  }

  return routes;
}

function buildRouter(dir = routesDir) {
  const router = express.Router();
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === '__tests__') continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subRouter = buildRouter(fullPath);
      router.use(`/${entry.name}`, subRouter);
    } else if (entry.isFile() && entry.name.endsWith('.route.js')) {
      const def = require(fullPath);
      if (!def) continue;

      if (def.method && def.handler) {
        const p = def.path || `/${path.basename(entry.name, '.js')}`;
        let middleware = Array.isArray(def.middleware) ? [...def.middleware] : [];

        if (def.rateLimit) {
          const rlMw = createRateLimiter(def.rateLimit);
          rlMw._label = `rateLimit(${JSON.stringify(def.rateLimit)})`;
          middleware = [rlMw, ...middleware];
        }

        if (typeof router[def.method.toLowerCase()] === 'function') {
          router[def.method.toLowerCase()](p, ...middleware, def.handler);
        }
      } else if (typeof def === 'function' || (def.stack || def.use)) {
        const mountPath = `/${path.basename(entry.name, '.js')}`;
        router.use(mountPath, def);
      }
    }
  }

  return router;
}

const Router = buildRouter();

/** Pre-computed route listing for the dev endpoint — avoids lazy rate limiter creation */
const cachedRoutes = collectRoutes();

module.exports = { collectRoutes, buildRouter, Router, routePrefix: '', cachedRoutes };
