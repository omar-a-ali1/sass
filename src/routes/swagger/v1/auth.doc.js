module.exports = {
  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new account',
      description: 'Creates a new user profile inside the database and securely hashes passwords before parsing execution context.',
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
          description: 'Account provisioned successfully',
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
  }
};