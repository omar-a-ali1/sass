module.exports = {
  ValidationError: {
      description: 'Bad Request - Input validation failed or input payload is corrupted',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              status: { type: 'string', example: 'fail' },
              traceId: { type: 'string', example: '39fb65de' },
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'The data provided is invalid or corrupted.' },
                  stack: { 
                    type: 'string', 
                    example: 'Error: The data provided is invalid or corrupted.\n    at /usr/src/app/src/middlewares/validation.js:11:29\n    at Layer.handleRequest (/usr/src/app/node_modules/router/lib/layer.js:152:17)...' 
                  },
                  fields: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    },
                    example: {
                      email: ['email must be a valid email']
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
  ConflictError: {
      description: 'Conflict - The resource already exists (e.g., email duplicate)',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              status: { type: 'string', example: 'fail' },
              traceId: { type: 'string', example: '84e38446' },
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Email already registered' },
                  stack: { 
                    type: 'string', 
                    example: 'Error: Email already registered\n    at AuthService.registerUser (/usr/src/app/src/services/authService.js:16:17)\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n    at async register (/usr/src/app/src/controllers/auth.controller.js:13:18)' 
                  }
                }
              }
            }
          }
        }
      }
    }
  ,
  InternalServerError: {
    description: 'Internal Server Error - Something went wrong on the core system',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            status: { type: 'string', example: 'error' },
            traceId: { type: 'string', example: '6e256651' },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Internal Server Error' }
              }
            }
          }
        }
      }
    }
  }
};