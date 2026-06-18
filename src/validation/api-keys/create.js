/**
 * Joi schema for API key creation
 *
 * @module validation/api-keys/create
 */

const Joi = require('joi');

module.exports = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .description('Human-readable label for this API key'),
  permissions: Joi.array().items(
    Joi.string().trim()
  ).optional()
    .description('Permission scopes for the key'),
});
