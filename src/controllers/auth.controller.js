/**
 * Authentication Controller
 *
 * Handles HTTP request/response for auth endpoints.
 * Delegates business logic to AuthService via the IoC container.
 *
 * @module controllers/auth.controller
 */

/**
 * Login a user
 *
 * POST /api/v1/auth/login
 * Retrieves `authService` from the container, validates credentials
 * via the service layer, and returns a JWT with the user profile.
 *
 * @async
 * @param {Object}   req  - Express request object (expects `req.validatedBody`, `req.getService`, `req.id`)
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const credential = req.validatedBody;
    const data = await authService.loginUser(credential)
    return res.status(201).json({
      success: true,
      traceId: req.id,
      data
    })
  } catch (err)
  {
    next(err)
  }
}

/**
 * Register a new user
 *
 * POST /api/v1/auth/register
 * Retrieves `authService` from the container, creates a new user
 * via the service layer, and returns the sanitized profile.
 *
 * @async
 * @param {Object}   req  - Express request object (expects `req.validatedBody`, `req.getService`, `req.id`)
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const credential = req.validatedBody;
    const user = await authService.registerUser(credential)
    return res.status(201).json({
      success: true,
      traceId: req.id,
      data: user
    });
  } catch (err)
  {
    next(err)
  }
}

module.exports = {
  login,
  register
}