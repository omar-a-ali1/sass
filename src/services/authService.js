const UserLogin = require("../validation/auth/login");
const ServerError = require('../errors/ServerError')
const Login = (req, res,next) =>
{
  const validatedData  =req.validatedBody
  try {
    
    return res.status(200).json({
      success: true,
      traceId: req.id,
      data: validatedData ?? 'err'
    })
  } catch (err)
  {
    next(new ServerError())
  }
}
const Register = (req, res, next) => {
 try { 
  return res.status(200).json({
    success: true,
    traceId: req.id,
    data: req.body
  })
}catch (err)
  {
    next(new ServerError())
  }
    
}
module.exports = {
  Login,
  Register
}