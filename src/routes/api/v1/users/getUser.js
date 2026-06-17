/**
 * GET /v1/users/:id — get user by ID
 *
 * @module routes/api/v1/users/getUser
 */

const authenticate = require('../../../../middlewares/auth');
const { getUser } = require('../../../../controllers/user.controller');

module.exports = {
  method: 'get',
  path: '/:id',
  middleware: [authenticate],
  handler: getUser,
  docs: {
    tags: ['Users'],
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique ID.',
    responses: {
      200: { description: 'User found' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
    },
  },
};
