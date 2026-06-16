const NotFoundError = require("../errors/NotFoundError");
const ConflictError = require("../errors/ConflictError");
const ServerError = require('../errors/ServerError');

class AuthService 
{
  constructor({ userRepository }) {
      this.userRepository = userRepository;
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

}

module.exports = AuthService;
