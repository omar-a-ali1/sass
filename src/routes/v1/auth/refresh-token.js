/**
 * POST /auth/refresh-token — exchange a refresh token for a new token pair
 *
 * @module routes/v1/auth/refresh-token
 */

const validateMiddleware = require('../../../middlewares/validation');
const createRateLimiter = require('../../../middlewares/rateLimiter');
const refreshTokenSchema = require('../../../validation/auth/refreshToken');
const { refresh } = require('../../../controllers/auth.controller');

const refreshLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many refresh attempts, please try again later.',
});

module.exports = {
  method: 'post',
  path: '/refresh-token',
  middleware: [refreshLimiter, validateMiddleware(refreshTokenSchema)],
  handler: refresh,
  docs: {
    tags: ['Authentication'],
    summary: 'Refresh token pair',
    description: 'Accepts a valid refresh token and returns a new access token + refresh token pair. Use this when the access token expires.',
    responses: {
      200: {
        description: 'Tokens refreshed successfully — returns new access and refresh tokens',
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
