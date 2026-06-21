const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrf(req, res, next) {
  const config = req.container ? req.container.get('config') : require('../config/environment');
  const projectType = config.projectType || 'jwt';

  if (projectType === 'jwt') return next();

  const cookieName = 'csrf-token';
  const headerName = 'x-csrf-token';

  if (SAFE_METHODS.has(req.method)) {
    if (!req.cookies[cookieName]) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(cookieName, token, {
        httpOnly: false,
        sameSite: projectType === 'cookies' ? 'strict' : 'lax',
        secure: config.env === 'production',
      });
    }
    return next();
  }

  const tokenFromCookie = req.cookies[cookieName];
  const tokenFromHeader = req.headers[headerName];

  if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
    return res.status(403).json({
      success: false,
      traceId: req.id,
      error: 'CSRF token mismatch or missing',
    });
  }

  next();
}

module.exports = csrf;