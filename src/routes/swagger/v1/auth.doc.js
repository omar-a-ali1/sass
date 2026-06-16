/**
 * Auth API Paths (Swagger)
 *
 * Defines the `/auth/register` and `/auth/login` OpenAPI paths.
 * Request body schemas are auto-generated from Joi validators
 * via `joi-to-swagger` and referenced from shared components.
 *
 * @module routes/swagger/v1/auth.doc
 */

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
        400: { $ref: '#/components/responses/ValidationError' },
        409: { $ref: '#/components/responses/ConflictError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login to the API',
      description: 'Authenticates with email and password, returns a signed JWT and the sanitized user profile.',
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
          description: 'Authentication successful — returns JWT token and user profile',
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
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
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
  },
};