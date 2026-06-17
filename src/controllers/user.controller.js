/**
 * User Controller
 *
 * @module controllers/user.controller
 */

/**
 * Get user by ID
 *
 * GET /api/v1/users/:id
 *
 * @async
 * @param {Object}   req  - Express request object (params.id available)
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUser = async (req, res, next) => {
  try {
    const authService = req.getService('authService');
    const profile = await authService.getProfile(req.params.id);
    return res.respond(profile);
  } catch (err) {
    next(err);
  }
};

/**
 * List users with pagination, sort, and search
 *
 * GET /api/v1/users — reads validated query params, then calls
 * the database strategy's paginate method.
 *
 * @async
 * @param {Object}   req  - Express request object (validatedQuery available)
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, sort, search, ...filters } = req.validatedQuery;
    const sortExpr = sort === 'asc' ? 'createdAt' : '-createdAt';

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const db = req.getService('dbStrategy');
    const result = await db.paginate('User', filters, { page, limit, sort: sortExpr });
    return res.paginated(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUser, listUsers };
