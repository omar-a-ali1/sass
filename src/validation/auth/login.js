/**
 * Login Validation Schema
 *
 * Validates the request body for the POST /api/v1/auth/login endpoint.
 * Requires a valid email format and a password of at least 8 characters.
 *
 * @module validation/auth/login
 */

const Joi = require('joi');

/** @type {import('joi').ObjectSchema} */
const UserLogin = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .required(),
  password: Joi.string()
    .trim()
    .min(8)
    .required()
})

module.exports = UserLogin