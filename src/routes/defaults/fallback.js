/**
 * Fallback 404 Handler
 *
 * Catch-all middleware that passes a NotFoundError for any
 * request that did not match a defined route. Must be mounted
 * last in the middleware chain.
 *
 * @module routes/defaults/fallback
 */

const router = require('express').Router();
const NotFoundError = require('../../errors/NotFoundError');

router.use((req, res, next) => {
  next(new NotFoundError(
    `route not found [${req.originalUrl}]`
  ));
});

module.exports = router;