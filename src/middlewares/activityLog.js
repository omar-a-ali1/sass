const METHOD_ACTIONS = {
  GET:    'read',
  POST:   'create',
  PUT:    'update',
  PATCH:  'update',
  DELETE: 'delete',
};

const OBJECTID_RE = /^[0-9a-f]{24}$/i;

function inferResource(path) {
  const parts = path.split('/').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!OBJECTID_RE.test(parts[i]) && parts[i] !== 'api' && parts[i] !== 'v1') {
      return parts[i];
    }
  }
  return 'unknown';
}

const activityLog = (req, res, next) => {
  const end = res.end;
  res.end = function (...args) {
    if (req.getService) {
      const service = req.getService('activityLogService');
      const action = METHOD_ACTIONS[req.method] || req.method.toLowerCase();
      service.log({
        actor: req.user?.id || req.user?._id || null,
        action,
        resource: inferResource(req.originalUrl || req.url),
        resourceId: req.params?.id || req.params?._id || null,
        metadata: { method: req.method, statusCode: res.statusCode, query: req.query },
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
        traceId: req.id,
      }).catch(() => {});
    }
    return end.apply(res, args);
  };
  next();
};

module.exports = activityLog;
