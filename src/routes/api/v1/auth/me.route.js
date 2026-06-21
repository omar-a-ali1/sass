/**
 * GET /auth/me — return the authenticated user's profile
 *
 * @module routes/v1/auth/me
 */

const authenticate = require('../../../../middlewares/auth');
const authorize = require('../../../../middlewares/authorize');
const { getProfile } = require('../../../../controllers/auth.controller');

module.exports = {
  method: 'get',
  path: '/me',
  middleware: [authenticate, authorize('user', 'admin')],
  handler: getProfile,
  docs: {
    tags: ['Authentication'],
    summary: 'Get current user profile',
    description: 'Returns the authenticated user\'s profile. Requires a valid Bearer JWT.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User profile retrieved successfully',
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
      404: { $ref: '#/components/responses/NotFoundError' }
    }
  }
};
