/**
 * POST /auth/register — create a new user account
 *
 * @module routes/v1/auth/register
 */

const validateMiddleware = require('../../../middlewares/validation');
const createRateLimiter = require('../../../middlewares/rateLimiter');
const registerSchema = require('../../../validation/auth/register');
const { register } = require('../../../controllers/auth.controller');

const registerLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many registration attempts, please try again later.',
});

module.exports = {
  method: 'post',
  path: '/register',
  middleware: [registerLimiter, validateMiddleware(registerSchema)],
  handler: register,
  docs: {
    tags: ['Authentication'],
    summary: 'Register a new account',
    description: 'Creates a new user profile, securely hashes the password before persisting, and returns the sanitized user data.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/RegisterRequest' }
        }
      }
    },
    responses: {
      201: {
        description: 'Account created successfully — returns sanitized user profile',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                traceId: { type: 'string', example: '6e256651' },
                data: { $ref: '#/components/schemas/UserResponse' }
              }
            }
          }
        }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      409: { $ref: '#/components/responses/ConflictError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
};
