const NotFoundError = require('../errors/NotFoundError');

const fallback = (req, res, next) => {
  next(new NotFoundError(`route not found [${req.originalUrl}]`));
};

module.exports = fallback;
