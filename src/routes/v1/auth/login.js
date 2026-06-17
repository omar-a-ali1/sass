/**
 * POST /auth/login — authenticate and receive access + refresh tokens
 *
 * @module routes/v1/auth/login
 */

const validateMiddleware = require('../../../middlewares/validation');
const createRateLimiter = require('../../../middlewares/rateLimiter');
const loginSchema = require('../../../validation/auth/login');
const { login } = require('../../../controllers/auth.controller');

const loginLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
});

module.exports = {
  method: 'post',
  path: '/login',
  middleware: [loginLimiter, validateMiddleware(loginSchema)],
  handler: login,
  docs: {
    tags: ['Authentication'],
    summary: 'Login to the API',
    description: 'Authenticates with email and password. Returns an access token, refresh token, and the sanitized user profile.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/LoginRequest' }
        }
      }
    },
    responses: {
      201: {
        description: 'Authentication successful — returns access token, refresh token, and user profile',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                traceId: { type: 'string', example: '6e256651' },
                data: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/UserResponse' },
                    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                  }
                }
              }
            }
          }
        }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
};
