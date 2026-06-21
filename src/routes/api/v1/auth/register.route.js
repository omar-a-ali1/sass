/**
 * POST /auth/register — create a new user account
 *
 * @module routes/v1/auth/register
 */

const validateMiddleware = require('../../../../middlewares/validation');
const registerSchema = require('../../../../validation/auth/register');
const { register } = require('../../../../controllers/auth.controller');

module.exports = {
  method: 'post',
  path: '/register',
  rateLimit: { max: 10, windowMs: 60 * 1000, message: 'Too many registration attempts, please try again later.' },
  middleware: [validateMiddleware(registerSchema)],
  handler: register,
  docs: {
    tags: ['Authentication'],
    summary: 'Register a new account',
    description: 'Creates a new user profile, securely hashes the password before persisting, and returns the sanitized user data.',
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
      409: { $ref: '#/components/responses/ConflictError' }
    }
  }
};
