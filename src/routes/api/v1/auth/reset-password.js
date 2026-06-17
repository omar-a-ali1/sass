/**
 * POST /auth/reset-password — reset password using a valid token
 *
 * @module routes/v1/auth/reset-password
 */

const validateMiddleware = require('../../../../middlewares/validation');
const createRateLimiter = require('../../../../middlewares/rateLimiter');
const resetPasswordSchema = require('../../../../validation/auth/resetPassword');
const { resetPassword } = require('../../../../controllers/auth.controller');

const resetLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts, please try again later.',
});

module.exports = {
  method: 'post',
  path: '/reset-password',
  middleware: [resetLimiter, validateMiddleware(resetPasswordSchema)],
  handler: resetPassword,
  docs: {
    tags: ['Authentication'],
    summary: 'Reset password using a reset token',
    description: 'Accepts a valid reset token and a new password. Verifies the token, hashes the new password, and updates the user record.',
    responses: {
      200: {
        description: 'Password reset successfully',
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
                    message: { type: 'string', example: 'Password has been reset successfully.' }
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
