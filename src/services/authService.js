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
   * Authenticate a user and issue a JWT pair
   *
   * Looks up the user by email, compares the provided password
   * against the stored hash, and on success generates an access
   * token and a refresh token.
   *
   * @async
   * @param {Object} userData           - Login credentials
   * @param {string} userData.email     - User's email address
   * @param {string} userData.password  - Raw password to verify
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>} Tokens + profile
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

    const accessToken = this.securityService.generateAuthToken(existingUser)
    const refreshToken = this.securityService.generateRefreshToken(existingUser)

    return {
      user: sanitizeData(existingUser),
      accessToken,
      refreshToken
    };
  }

  /**
   * Issue a new access token using a valid refresh token
   *
   * Verifies the refresh token, looks up the user, and returns
   * a fresh token pair.
   *
   * @async
   * @param {string} refreshToken - Valid refresh JWT string
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>} New token pair + profile
   * @throws {UnauthorizedError} If refresh token is invalid or user not found
   */
  async refreshToken(refreshToken)
  {
    let decoded;
    try {
      decoded = this.securityService.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const newAccessToken = this.securityService.generateAuthToken(user);
    const newRefreshToken = this.securityService.generateRefreshToken(user);

    return {
      user: sanitizeData(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }
}
module.exports = AuthService;
