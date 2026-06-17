/**
 * Response Envelope Middleware
 *
 * Attaches convenience methods to the response object so controllers
 * can send consistent JSON envelopes without boilerplate.
 *
 * @module middlewares/responder
 */

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const responder = (req, res, next) => {
  res.respond = (data, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      traceId: req.id,
      data,
    });
  };

  res.paginated = (paginatedResult, statusCode = 200) => {
    const { data, total, page, limit, totalPages } = paginatedResult;
    return res.status(statusCode).json({
      success: true,
      traceId: req.id,
      data,
      meta: { total, page, limit, totalPages },
    });
  };

  res.fail = (message, statusCode = 400) => {
    return res.status(statusCode).json({
      success: false,
      traceId: req.id,
      error: message,
    });
  };

  next();
};

module.exports = responder;
