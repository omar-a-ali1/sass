const NotFoundError = require("../errors/NotFoundError");
const ConflictError = require("../errors/ConflictError");
const ServerError = require('../errors/ServerError');
const UnauthorizedError = require('../errors/UnauthorizedError')
const sanitizeData = require('../helpers/sanitizeData');
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
    const hashedPassword = await this.securityService.hashPassword(userData.password);
    
   
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    })
    return sanitizeData(user);
  }
  async loginUser(userData)
  {
    const existingUser = await this.userRepository.findByEmail(userData.email);
        if (!existingUser) {
          throw new UnauthorizedError('Invalid email or password');
        }
    console.log('Provided Password:', userData.password);
    console.log('Stored Hash in DB:', existingUser.password);
    
    const isPasswordValid = await this.securityService.comparePassword(userData.password,existingUser.password)

    if (!isPasswordValid)
    {
        throw new UnauthorizedError('Invalid email or password')
    }
    const token = this.securityService.generateAuthToken(existingUser)

    return {
          user: sanitizeData(existingUser),
          token: token
        };
  }
}
module.exports = AuthService;
