/**
 * Forgot Password Validation Schema
 *
 * Validates the request body for the POST /api/v1/auth/forgot-password endpoint.
 * Requires a valid email address.
 *
 * @module validation/auth/forgotPassword
 */

const Joi = require('joi');

/** @type {import('joi').ObjectSchema} */
const ForgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .required()
    .messages({
      'string.email': 'email must be a valid email address',
      'any.required': 'email is required'
    })
});

module.exports = ForgotPasswordSchema;
