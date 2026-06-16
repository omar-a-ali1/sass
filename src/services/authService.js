/**
 * Authentication Service
 *
 * Contains the business logic for user registration and login.
 * Delegates persistence to UserRepository and cryptographic
 * operations to SecurityService.
 *
 * @module services/authService
 */

const ConflictError = require("../errors/ConflictError");
const UnauthorizedError = require('../errors/UnauthorizedError')
const sanitizeData = require('../helpers/sanitizeData');

class AuthService
{
  /**
   * @param {Object}   deps
   * @param {Object}   deps.securityService  - SecurityService instance (hashing, JWT,...)
   * @param {Object}   deps.userRepository   - UserRepository instance (data access)
   */
  constructor({ securityService, userRepository }) {
    this.userRepository = userRepository
    this.securityService = securityService
  }

  /**
   * Register a new user
   *
   * Checks for duplicate email, hashes the password, persists the user,
   * and returns a sanitized document (password and __v stripped).
   *
   * @async
   * @param {Object} userData           - Registration payload
   * @param {string} userData.name      - User's full name
   * @param {string} userData.email     - User's email address
   * @param {string} userData.password  - Raw password (will be hashed)
   * @returns {Promise<Object>} Sanitized user object
   * @throws {ConflictError} If the email is already registered
   */
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

  /**
   * Authenticate a user and issue a JWT
   *
   * Looks up the user by email, compares the provided password
   * against the stored hash, and on success generates a signed JWT.
   *
   * @async
   * @param {Object} userData           - Login credentials
   * @param {string} userData.email     - User's email address
   * @param {string} userData.password  - Raw password to verify
   * @returns {Promise<{user: Object, token: string}>} Sanitized user + JWT
   * @throws {UnauthorizedError} If email not found or password mismatch
   */
  async loginUser(userData)
  {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (!existingUser) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await this.securityService.comparePassword(
      userData.password,
      existingUser.password
    );

    if (!isPasswordValid) {
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
