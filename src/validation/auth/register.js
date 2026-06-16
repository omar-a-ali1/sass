/**
 * Registration Validation Schema
 *
 * Validates the request body for the POST /api/v1/auth/register endpoint.
 * Requires a name (2-30 chars), a valid email, and a password (min 8 chars).
 *
 * @module validation/auth/register
 */

const Joi = require('joi');

/** @type {import('joi').ObjectSchema} */
const RegisterUser = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(30)
    .required(),
  email: Joi.string()
    .email()
    .trim()
    .required(),
  password: Joi.string()
    .trim()
    .min(8)
    .required()
})

module.exports = RegisterUser