/**
 * Refresh Token Validation Schema
 *
 * Validates the request body for the POST /api/v1/auth/refresh-token endpoint.
 * Requires a non-empty JWT string in the `refreshToken` field.
 *
 * @module validation/auth/refreshToken
 */

const Joi = require('joi');

/** @type {import('joi').ObjectSchema} */
const RefreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'refreshToken must not be empty',
      'any.required': 'refreshToken is required'
    })
});

module.exports = RefreshTokenSchema;
