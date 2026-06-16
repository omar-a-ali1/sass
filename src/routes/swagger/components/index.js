const j2s = require('joi-to-swagger');
const RegisterUserSchema = require('../../../validation/auth/register');
const LoginUserSchema = require('../../../validation/auth/login');
const baseResponses = require('./responses');
const entitySchemas = require('../schemas');
module.exports = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token to access protected microservices.'
    }
  },
  
  responses: baseResponses,

  schemas: {
    LoginRequest: j2s(LoginUserSchema).swagger,
    RegisterRequest: j2s(RegisterUserSchema).swagger,


    ...entitySchemas,
    UserResponse: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6a312a635cef44df5183204a' },
        name: { type: 'string', example: 'Omar' },
        email: { type: 'string', example: 'omyassdar@mail.com' },
        __v: { type: 'integer', example: 0 }
      }
    }
  }
};