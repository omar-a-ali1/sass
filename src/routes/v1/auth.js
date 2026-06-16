/**
 * Authentication Routes (v1)
 *
 * Defines POST endpoints for user registration, login, and
 * token refresh. Registration and login apply Joi validation
 * middleware before delegating to the auth controller.
 *
 * @module routes/v1/auth
 */

const router = require('express').Router()
const validateMiddleware = require('../../middlewares/validation')
const loginSchema = require('../../validation/auth/login');
const registerSchema = require('../../validation/auth/register');
const refreshTokenSchema = require('../../validation/auth/refreshToken');
const { register, login, refresh } = require('../../controllers/auth.controller');

/** POST /api/v1/auth/register — create a new user account */
router.post('/register', [
  validateMiddleware(registerSchema)
], register);

/** POST /api/v1/auth/login — authenticate and receive access + refresh tokens */
router.post('/login', [
  validateMiddleware(loginSchema)
], login)

/** POST /api/v1/auth/refresh-token — exchange a refresh token for a new token pair */
router.post('/refresh-token', [
  validateMiddleware(refreshTokenSchema)
], refresh)

module.exports = router
