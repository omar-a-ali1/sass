const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function setCsrfCookie(req, res) {
  const config = req.container ? req.container.get('config') : require('../config/environment');
  const projectType = config.projectType || 'jwt';
  if (projectType === 'jwt') return;

  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf-token', token, {
    httpOnly: false,
    sameSite: projectType === 'cookies' ? 'strict' : 'lax',
    secure: config.env === 'production',
  });
}

function csrf(req, res, next) {
  const config = req.container ? req.container.get('config') : require('../config/environment');
  const projectType = config.projectType || 'jwt';

  if (projectType === 'jwt') return next();
  if (SAFE_METHODS.has(req.method)) return next();

  const tokenFromCookie = req.cookies['csrf-token'];
  const tokenFromHeader = req.headers['x-csrf-token'];

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
module.exports.setCsrfCookie = setCsrfCookie;