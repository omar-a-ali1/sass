/**
 * Shared OpenAPI Components
 *
 * Assembles all reusable specification objects:
 * - Security schemes (bearer JWT)
 * - Error response templates (400, 401, 409, 500)
 * - Request/response schemas (auto-generated from Joi + manual entity schemas)
 *
 * @module swagger/components/index
 */

const j2s = require('joi-to-swagger');
const RegisterUserSchema = require('../../validation/auth/register');
const LoginUserSchema = require('../../validation/auth/login');
const ForgotPasswordSchema = require('../../validation/auth/forgotPassword');
const ResetPasswordSchema = require('../../validation/auth/resetPassword');
const baseResponses = require('./responses');
const { modelSchemas } = require('../../bootstrap/loadModels');

module.exports = {
  /** Authentication schemes */
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token to access protected microservices.'
    },
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
      description: 'JWT stored in a cookie named "token". Sent automatically by the browser.'
    }
  },

  /** Shared error response definitions */
  responses: baseResponses,

  /** Request and response schema objects */
  schemas: {
    /** Auto-generated from login Joi schema */
    LoginRequest: j2s(LoginUserSchema).swagger,
    /** Auto-generated from register Joi schema */
    RegisterRequest: j2s(RegisterUserSchema).swagger,
    /** Auto-generated from forgot-password Joi schema */
    ForgotPasswordRequest: j2s(ForgotPasswordSchema).swagger,
    /** Auto-generated from reset-password Joi schema */
    ResetPasswordRequest: j2s(ResetPasswordSchema).swagger,

    /** Auto-generated from Mongoose models via mongoose-to-swagger */
    ...modelSchemas,

    /** Inline user response shape (includes __v for debugging) */
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