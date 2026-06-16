/**
 * JWT Authentication Middleware
 *
 * Extracts a Bearer token from the Authorization header,
 * verifies it using the configured JWT secret, and attaches
 * the decoded payload to `req.user`. Returns 401 if the
 * token is missing, expired, or invalid.
 *
 * Usage in routes:
 *   router.get('/protected', authenticate, handler);
 *
 * @module middlewares/auth
 */

const { verifyJwt } = require('../repositories/security.repository');
const { HTTP_REQUESTS } = require('../constants/system');

/**
 * Require a valid JWT for the route
 *
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      status: HTTP_REQUESTS[401].status,
      traceId: req.id,
      error: { message: 'Authentication required — no token provided' }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token);
    /** Decoded JWT payload available to downstream handlers */
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      status: HTTP_REQUESTS[401].status,
      traceId: req.id,
      error: { message: 'Invalid or expired token' }
    });
  }
};

module.exports = authenticate;
