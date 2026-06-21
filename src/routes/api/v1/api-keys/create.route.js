/**
 * POST /api-keys — create a new API key
 *
 * @module routes/v1/api-keys/create
 */

const authenticate = require('../../../../middlewares/auth');
const validateMiddleware = require('../../../../middlewares/validation');
const createKeySchema = require('../../../../validation/api-keys/create');
const { create } = require('../../../../controllers/apiKey.controller');

module.exports = {
  method: 'post',
  path: '/',
  middleware: [authenticate, validateMiddleware(createKeySchema)],
  handler: create,
  docs: {
    tags: ['API Keys'],
    summary: 'Create a new API key',
    description: 'Generates an API key for the authenticated user. The raw key is returned only once.',
    responses: {
      201: {
        description: 'API key created — raw key returned only in this response',
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
                    apiKey: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        prefix: { type: 'string', example: 'sass_a1b2c3d4' },
                        name: { type: 'string', example: 'My API Key' },
                        user: { type: 'string' },
                        active: { type: 'boolean', example: true },
                        permissions: { type: 'array', items: { type: 'string' } },
                      }
                    },
                    rawKey: { type: 'string', example: 'sass_a1b2c3d4e5f6...' },
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
