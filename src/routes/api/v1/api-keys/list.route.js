/**
 * GET /api-keys — list API keys for the authenticated user
 *
 * @module routes/v1/api-keys/list
 */

const authenticate = require('../../../../middlewares/auth');
const { list } = require('../../../../controllers/apiKey.controller');

module.exports = {
  method: 'get',
  path: '/',
  middleware: [authenticate],
  handler: list,
  docs: {
    tags: ['API Keys'],
    summary: 'List API keys',
    description: 'Returns all API keys owned by the authenticated user.',
    responses: {
      200: {
        description: 'List of API keys',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                traceId: { type: 'string', example: '6e256651' },
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      prefix: { type: 'string' },
                      name: { type: 'string' },
                      active: { type: 'boolean' },
                      lastUsedAt: { type: 'string', nullable: true },
                      createdAt: { type: 'string' },
                    }
                  }
                }
              }
            }
          }
        }
      },
    }
  }
};
