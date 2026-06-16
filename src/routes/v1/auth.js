const router = require('express').Router()
const validateMiddleware = require('../../middlewares/validation')
const loginSchema = require('../../validation/auth/login');
const { register, login } = require('../../controllers/auth.controller');


router.post('/register', [
  validateMiddleware(loginSchema)
], register);

module.exports = router
