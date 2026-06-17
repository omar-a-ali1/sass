/**
 * POST /auth/forgot-password — request a password reset link
 *
 * @module routes/v1/auth/forgot-password
 */

const validateMiddleware = require('../../../../middlewares/validation');
const createRateLimiter = require('../../../../middlewares/rateLimiter');
const forgotPasswordSchema = require('../../../../validation/auth/forgotPassword');
const { forgotPassword } = require('../../../../controllers/auth.controller');

const forgotLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many password reset requests, please try again later.',
});

module.exports = {
  method: 'post',
  path: '/forgot-password',
  middleware: [forgotLimiter, validateMiddleware(forgotPasswordSchema)],
  handler: forgotPassword,
  docs: {
    tags: ['Authentication'],
    summary: 'Request a password reset link',
    description: 'Accepts an email address and sends a password reset link if the email is registered. Always returns the same response to avoid leaking user existence.',
    responses: {
      200: {
        description: 'Reset link sent (or email does not exist — same response for security)',
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
                    message: { type: 'string', example: 'If that email is registered, a reset link has been sent.' }
                  }
                }
              }
            }
          }
        }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
};
