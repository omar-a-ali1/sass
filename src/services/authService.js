/**
 * Authentication Service
 *
 * Contains the business logic for user registration and login.
 * Delegates persistence to UserRepository and cryptographic
 * operations to SecurityService.
 *
 * @module services/authService
 */

const ConflictError = require('../lib/errors/ConflictError');
const UnauthorizedError = require('../lib/errors/UnauthorizedError')
const NotFoundError = require('../lib/errors/NotFoundError')
const sanitizeData = require('../lib/utils/sanitizeData');

class AuthService
{
  /**
   * @param {Object}   deps
   * @param {Object}   deps.securityService   - SecurityService instance (hashing, JWT,...)
   * @param {Object}   deps.userRepository    - UserRepository instance (data access)
   * @param {Object}   deps.emailStrategy     - Email strategy instance (console, SMTP, ...)
   */
  constructor({ securityService, userRepository, emailStrategy }) {
    this.userRepository = userRepository
    this.securityService = securityService
    this.emailStrategy = emailStrategy
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
  /**
   * Initiate a password-reset flow
   *
   * Looks up the user by email. If found, generates a short-lived
   * reset JWT and sends it via the email strategy. Always returns
   * a 200-level response to avoid leaking whether the email exists.
   *
   * @async
   * @param {string} email - Registered email address
   * @returns {Promise<{message: string}>}
   */
  async forgotPassword(email)
  {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return { message: 'If that email is registered, a reset link has been sent.' };
    }

    const resetToken = this.securityService.generateResetToken(user);
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

    await this.emailStrategy.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 15 minutes. If you did not request this, please ignore this email.</p>`,
    });

    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  /**
   * Reset a user's password using a valid reset token
   *
   * Verifies the reset JWT, looks up the user, hashes the new
   * password, and persists the update.
   *
   * @async
   * @param {string} resetToken  - Valid reset JWT
   * @param {string} newPassword - New plain-text password
   * @returns {Promise<{message: string}>}
   * @throws {UnauthorizedError} If the token is invalid or expired
   * @throws {NotFoundError} If the user no longer exists
   */
  async resetPassword(resetToken, newPassword)
  {
    let decoded;
    try {
      decoded = this.securityService.verifyResetToken(resetToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const user = await this.userRepository.findById(decoded.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await this.securityService.hashPassword(newPassword);
    await this.userRepository.updateById(decoded.id, { password: hashedPassword });

    return { message: 'Password has been reset successfully.' };
  }

  /**
   * Get the authenticated user's profile
   *
   * @async
   * @param {string} id - User document ID (from JWT payload)
   * @returns {Promise<Object>} Sanitized user profile
   * @throws {NotFoundError} If the user no longer exists
   */
  async getProfile(id)
  {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return sanitizeData(user);
  }

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
