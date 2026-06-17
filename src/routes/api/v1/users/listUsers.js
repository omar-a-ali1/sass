/**
 * GET /v1/users — list users with query params
 *
 * Demonstrates auto-documented query parameters using validateQuery.
 *
 * @module routes/api/v1/users/listUsers
 */

const authenticate = require('../../../../middlewares/auth');
const validateMiddleware = require('../../../../middlewares/validation');
const listUsersQuery = require('../../../../validation/users/list');
const { listUsers } = require('../../../../controllers/user.controller');

module.exports = {
  method: 'get',
  path: '/',
  middleware: [
    // authenticate,
    validateMiddleware.validateQuery(listUsersQuery)
  ],
  handler: listUsers,
  docs: {
    tags: ['Users'],
    summary: 'List users with pagination and search',
    description: 'Returns a paginated list of users. Supports page, limit, sort, and search query params.',
    responses: {
      200: { description: 'Paginated list of users' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' },
    },
  },
};
