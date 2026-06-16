/**
 * Authentication Routes (v1)
 *
 * Defines POST endpoints for user registration and login.
 * Each endpoint applies Joi validation middleware before
 * delegating to the auth controller.
 *
 * @module routes/v1/auth
 */

const router = require('express').Router()
const validateMiddleware = require('../../middlewares/validation')
const loginSchema = require('../../validation/auth/login');
const registerSchema = require('../../validation/auth/register');
const { register, login } = require('../../controllers/auth.controller');

/** POST /api/v1/auth/register — create a new user account */
router.post('/register', [
  validateMiddleware(registerSchema)
], register);

/** POST /api/v1/auth/login — authenticate and receive a JWT */
router.post('/login', [
  validateMiddleware(loginSchema)
], login)

module.exports = router
