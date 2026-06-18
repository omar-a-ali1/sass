/**
 * API Key Authentication Middleware
 *
 * Authenticates requests using the X-API-Key header. Validates the
 * key against stored bcrypt hashes and attaches the owning user's
 * ID and key metadata to the request.
 *
 * Usage in routes:
 *   router.get('/protected', apiKeyAuth, handler);
 *
 * @module middlewares/apiKeyAuth
 */

const { HTTP_REQUESTS } = require('../config/system');

/**
 * Authenticate via API key in the X-API-Key header
 *
 * On success sets:
 *   req.user  = { id, email, role }  — resolved from the ApiKey's user
 *   req.apiKey = { id, name, permissions }
 *
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Next middleware function
 */
const apiKeyAuth = async (req, res, next) => {
  const header = req.headers['x-api-key'];

  if (!header) {
    return res.status(401).json({
      success: false,
      status: HTTP_REQUESTS[401].status,
      traceId: req.id,
      error: { message: 'API key required — provide it via the X-API-Key header' }
    });
  }

  try {
    const apiKeyService = req.getService('apiKeyService');
    const record = await apiKeyService.validateKey(header);

    if (!record) {
      return res.status(401).json({
        success: false,
        status: HTTP_REQUESTS[401].status,
        traceId: req.id,
        error: { message: 'Invalid or expired API key' }
      });
    }

    req.apiKey = {
      id: record._id,
      name: record.name,
      permissions: record.permissions || [],
    };

    req.user = { id: record.user };

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: HTTP_REQUESTS[500].status,
      traceId: req.id,
      error: { message: 'Internal server error during API key validation' }
    });
  }
};

module.exports = apiKeyAuth;
