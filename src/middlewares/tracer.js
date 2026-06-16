const crypto = require('crypto')
const morgan = require('morgan')
const logger = require("../utils/logger")

morgan.token('id', (req) => req.id);

const tracerMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID().split('-')[0];
  
  res.setHeader('X-Request-ID', req.id);

  const morganInstance = morgan(
    '[:id] :method :url :status :res[content-length] - :response-time ms',
    { stream: { write: (message) => logger.http(message.trim()) } }
  );

  morganInstance(req, res, next);
};

module.exports = tracerMiddleware;