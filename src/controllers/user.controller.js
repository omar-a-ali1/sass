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
    return res.status(200).json({
      success: true,
      traceId: req.id,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List users with pagination, sort, and search
 *
 * GET /api/v1/users — demonstrates auto-documented query params
 *
 * @async
 * @param {Object}   req  - Express request object (validatedQuery available)
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const listUsers = async (req, res, next) => {
  try {
    const query = req.validatedQuery;
    return res.status(200).json({
      success: true,
      traceId: req.id,
      data: {
        params: query,
        message: 'Query params auto-documented in Swagger via Joi schema',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUser, listUsers };
