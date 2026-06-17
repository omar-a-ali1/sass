const getUser = async (req, res, next) => {
  try {
    const userService = req.getService('userService');
    const user = await userService.get(req.params.id);
    return res.respond(user);
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const userService = req.getService('userService');
    const result = await userService.list(req.validatedQuery);
    return res.paginated(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUser, listUsers };
