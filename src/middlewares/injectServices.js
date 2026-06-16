const container = require("../services/container");
const injectServices = (req, res, next) =>
{
  req.container = container
  req.getService = (name) => container.get(name)
  next()
}
module.exports = injectServices