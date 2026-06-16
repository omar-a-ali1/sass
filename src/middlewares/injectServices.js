/**
 * Service Injection Middleware
 *
 * Attaches the IoC dependency container to every incoming request,
 * providing a `req.getService(name)` helper so controllers can
 * retrieve registered services without manual instantiation.
 *
 * @module middlewares/injectServices
 */

const container = require("../services/container");

/**
 * @param {Object}   req  - Express request object
 * @param {Object}   res  - Express response object
 * @param {Function} next - Next middleware function
 */
const injectServices = (req, res, next) =>
{
  /** Reference to the singleton DependencyContainer */
  req.container = container
  /** Retrieve a registered service by name */
  req.getService = (name) => container.get(name)
  next()
}
module.exports = injectServices