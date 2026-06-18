const ForbiddenError = require('../errors/ForbiddenError');

const authorizeApiKey = (...perms) => {
  const flatPerms = perms.flat();

  const middleware = (req, res, next) => {
    if (!req.apiKey) {
      return next(new ForbiddenError('API key authentication required before permission check'));
    }

    const hasPerm = flatPerms.some(p => (req.apiKey.permissions || []).includes(p));
    if (!hasPerm) {
      return next(new ForbiddenError('API key does not have the required permissions'));
    }

    next();
  };

  middleware._perms = flatPerms;
  middleware._label = `authorizeApiKey([${flatPerms.map(p => `'${p}'`).join(', ')}])`;
  return middleware;
};

module.exports = authorizeApiKey;
