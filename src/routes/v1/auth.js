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
const createRateLimiter = require('../../middlewares/rateLimiter')
const loginSchema = require('../../validation/auth/login');
const registerSchema = require('../../validation/auth/register');
const refreshTokenSchema = require('../../validation/auth/refreshToken');
const { register, login, refresh } = require('../../controllers/auth.controller');

/** Rate limiters — stricter for login (brute-force protection) */
const loginLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, message: 'Too many login attempts, please try again later.' });
const registerLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10, message: 'Too many registration attempts, please try again later.' });
const refreshLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20, message: 'Too many refresh attempts, please try again later.' });

/** POST /api/v1/auth/register — create a new user account */
router.post('/register', [
  registerLimiter,
  validateMiddleware(registerSchema)
], register);

/** POST /api/v1/auth/login — authenticate and receive access + refresh tokens */
router.post('/login', [
  loginLimiter,
  validateMiddleware(loginSchema)
], login)

/** POST /api/v1/auth/refresh-token — exchange a refresh token for a new token pair */
router.post('/refresh-token', [
  refreshLimiter,
  validateMiddleware(refreshTokenSchema)
], refresh)

module.exports = router
