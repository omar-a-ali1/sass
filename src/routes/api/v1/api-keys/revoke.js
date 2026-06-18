/**
 * DELETE /api-keys/:id — revoke an API key
 *
 * @module routes/v1/api-keys/revoke
 */

const authenticate = require('../../../../middlewares/auth');
const { revoke } = require('../../../../controllers/apiKey.controller');

module.exports = {
  method: 'delete',
  path: '/:id',
  middleware: [authenticate],
  handler: revoke,
  docs: {
    tags: ['API Keys'],
    summary: 'Revoke an API key',
    description: 'Deactivates an API key so it can no longer be used for authentication.',
    responses: {
      200: {
        description: 'API key revoked',
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
                    message: { type: 'string', example: 'API key revoked' },
                  }
                }
              }
            }
          }
        }
      },
      404: { $ref: '#/components/responses/NotFoundError' },
    }
  }
};
