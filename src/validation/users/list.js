/**
 * List Users Query Validation Schema
 *
 * Validates query parameters for GET /api/v1/users.
 *
 * @module validation/users/list
 */

const Joi = require('joi');

/** @type {import('joi').ObjectSchema} */
const ListUsersQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .description('Page number for pagination'),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .description('Number of items per page'),
  sort: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .description('Sort order by creation date'),
  search: Joi.string()
    .optional()
    .allow('')
    .description('Search term to filter users by name or email'),
});

module.exports = ListUsersQuery;
