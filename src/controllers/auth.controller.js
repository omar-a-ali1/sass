const ServerError = require('../errors/ServerError');

const login = (req, res, next) =>
{
  return true
}
const register = async (req, res,next) =>
{
  try {
    
    const authService = req.getService('authService');
    const credential = req.validatedBody;
    const user = await authService.registerUser(credential)
    return res.status(200).json({
          success: true,
          traceId: req.id,
          data: user
        });
  } catch (err)
  {
    next( err)
  } 
 
}

module.exports = {
  login,
  register
}