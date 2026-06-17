/**
 * Role-Based Authorization Middleware
 *
 * Restricts route access to users with specific roles.
 * Must be used after the `authenticate` middleware so that
 * `req.user` is populated with the decoded JWT payload.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('admin'), handler);
 *   router.get('/mod', authenticate, authorize(['admin', 'moderator']), handler);
 *
 * @module middlewares/authorize
 */

const ForbiddenError = require('../errors/ForbiddenError');

/**
 * Require one or more roles to access the route
 *
 * @param {...string|string[]} roles - Allowed role(s)
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  const flatRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required before role check'));
    }

    if (!flatRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

module.exports = authorize;
