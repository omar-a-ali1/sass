/**
 * Root Router
 *
 * Aggregates all application routes:
 * - `GET /` returns a simple status message
 * - `/api-docs` serves Swagger UI
 * - `/health` exposes system health checks
 * - `/api/v1` hosts versioned API endpoints
 * - Fallback catches all unmatched routes with a 404
 *
 * @module routes/index
 */

const express = require('express');
const healthRoutes = require('./health');
const swaggerUi = require('swagger-ui-express');
const swaggerDocuemnt = require('./swagger')
const routeV1 = require('./v1/index');
const fallback = require('./defaults/fallback');
const router = express.Router();

/** Root health acknowledgement */
router.get('/', (req, res) =>
{
  return res.json({ message: "SASS work !" })
})

/** Swagger interactive API documentation */
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocuemnt));

/** System health endpoint */
router.use('/health', healthRoutes);

/** Version 1 API routes */
router.use('/api/v1', routeV1);

/** 404 catch-all for unmatched paths */
router.use(fallback);

module.exports = router;