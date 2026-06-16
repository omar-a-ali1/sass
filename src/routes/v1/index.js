/**
 * API Version 1 Router
 *
 * Mounts all v1 endpoint groups under `/api/v1`.
 * Currently serves auth routes (register, login).
 *
 * @module routes/v1/index
 */

const router = require('express').Router()
const authRoutes = require('./auth')

/** Authentication endpoints */
router.use('/auth', authRoutes)

module.exports = router