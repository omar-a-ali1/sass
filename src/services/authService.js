const NotFoundError = require("../errors/NotFoundError");
const ConflictError = require("../errors/ConflictError");
const ServerError = require('../errors/ServerError');

class AuthService 
{
  constructor({securityService , userRepository }) {
    this.userRepository = userRepository
    this.securityService = securityService
    
  }
  async registerUser(userData)
  {
    const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
          throw new ConflictError('Email already registered');
        }
    const user = await this.userRepository.create(userData)
    return user;
  }
  async loginUser(userData)
  {
    const existingUser = await this.userRepository.findByEmail(userData.email);
        if (!existingUser) {
          throw new NotFoundError('the provided mail do not match our records please register');
        }
  }

}

module.exports = AuthService;
