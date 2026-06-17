/**
 * API Version 1 Router — Auto-Loader
 *
 * Recursively scans `src/routes/v1/` and builds an Express router
 * from folder-based route definition files.
 *
 * Convention:
 *   src/routes/v1/auth/login.js → exports { method, path, middleware, handler }
 *                                 → POST /auth/login
 *
 * @module routes/v1/index
 */

const { buildRouter } = require('./loader');

module.exports = buildRouter(__dirname);
