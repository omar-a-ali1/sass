function cacheMiddleware(options = {}) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheStrategy = req.container ? req.container.get('cacheStrategy') : null;
    if (!cacheStrategy) return next();

    const ttl = options.ttl || undefined;
    const key = `route:${req.originalUrl}`;

    cacheStrategy.get(key).then(cached => {
      if (cached) {
        return res.status(cached.statusCode).json(cached.body);
      }

      const _json = res.json.bind(res);
      res.json = function (body) {
        cacheStrategy.set(key, { statusCode: res.statusCode, body }, ttl).catch(() => {});
        return _json(body);
      };

      next();
    }).catch(() => next());
  };
}

module.exports = cacheMiddleware;