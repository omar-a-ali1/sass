/**
 * Reset Password Validation Schema
 *
 * Validates the request body for the POST /api/v1/auth/reset-password endpoint.
 * Requires a reset token and a new password (min 8 characters).
 *
 * @module validation/auth/resetPassword
 */

const Joi = require('joi');

/** @type {import('joi').ObjectSchema} */
const ResetPasswordSchema = Joi.object({
  token: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'token must not be empty',
      'any.required': 'token is required'
    }),
  password: Joi.string()
    .trim()
    .min(8)
    .required()
    .messages({
      'string.min': 'password must be at least 8 characters',
      'any.required': 'password is required'
    })
});

module.exports = ResetPasswordSchema;
