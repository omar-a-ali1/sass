/**
 * Health Check Routes
 *
 * Provides a single endpoint for monitoring system health.
 * Delegates to the health controller for DB status and metrics.
 *
 * @module routes/health
 */

const express = require('express');
const { checkHealth } = require('../controllers/health.controller');

const router = express.Router();

/** GET /health — returns system status, DB health, uptime, memory */
router.get('/', checkHealth);

module.exports = router;