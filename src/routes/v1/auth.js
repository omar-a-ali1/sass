const router = require('express').Router()
const validateMiddleware = require('../../middlewares/validation')
const loginSchema = require('../../validation/auth/login');
const registerSchema = require('../../validation/auth/register');
const { register, login } = require('../../controllers/auth.controller');


router.post('/register', [
  validateMiddleware(registerSchema)
], register);
router.post('/login', [
  validateMiddleware(loginSchema)
], login)

module.exports = router
