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
 * via the service layer, and returns an access token + refresh token
 * with the user profile.
 *
 * @async
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const credential = req.validatedBody;
    const data = await authService.loginUser(credential)
    return res.respond(data, 201)
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
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const credential = req.validatedBody;
    const user = await authService.registerUser(credential)
    return res.respond(user, 201);
  } catch (err)
  {
    next(err)
  }
}

/**
 * Refresh token pair
 *
 * POST /api/v1/auth/refresh-token
 * Accepts a valid refresh token in the request body, verifies it,
 * and returns a new access token + refresh token pair.
 *
 * @async
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const refresh = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const { refreshToken } = req.validatedBody;
    const data = await authService.refreshToken(refreshToken);
    return res.respond(data);
  } catch (err)
  {
    next(err)
  }
}

/**
 * Initiate forgot-password flow
 *
 * POST /api/v1/auth/forgot-password
 * Accepts an email address, sends a reset link if the email is
 * registered. Always returns the same response to avoid leaking
 * whether the email exists.
 *
 * @async
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const forgotPassword = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const { email } = req.validatedBody;
    const data = await authService.forgotPassword(email);
    return res.respond(data);
  } catch (err)
  {
    next(err)
  }
}

/**
 * Reset password using a reset token
 *
 * POST /api/v1/auth/reset-password
 * Verifies the reset JWT and updates the user's password.
 *
 * @async
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const resetPassword = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const { token, password } = req.validatedBody;
    const data = await authService.resetPassword(token, password);
    return res.respond(data);
  } catch (err)
  {
    next(err)
  }
}

/**
 * Get authenticated user profile
 *
 * GET /api/v1/auth/me
 * Requires a valid Bearer JWT. Returns the current user's profile
 * from the database.
 *
 * @async
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) =>
{
  try {
    const authService = req.getService('authService');
    const data = await authService.getProfile(req.user.id);
    return res.respond(data);
  } catch (err)
  {
    next(err)
  }
}

module.exports = {
  login,
  register,
  refresh,
  forgotPassword,
  resetPassword,
  getProfile
}