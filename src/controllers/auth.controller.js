const AuthService = require('../services/authService')


const login = (req, res,next) =>
{
  return AuthService.Login()
}
const register = (req, res,next) =>
{
  return AuthService.Register(req,res,next)
}

module.exports = {
  login,
  register
}