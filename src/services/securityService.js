/**
 * Security Service
 *
 * Provides an abstraction layer over cryptographic operations.
 * Delegates to SecurityRepository for bcrypt hashing and JWT signing.
 *
 * @module services/securityService
 */

class SecurityService {
  /**
   * @param {Object}   deps
   * @param {Object}   deps.secRepository - SecurityRepository instance
   */
  constructor({ secRepository }) {
    this.secRepository = secRepository;
  }

  /**
   * Hash a plain-text password
   * @async
   * @param {string} password - Raw password to hash
   * @returns {Promise<string>} Bcrypt-hashed password string
   */
  async hashPassword(password) {
    return await this.secRepository.hash(password)
  }

  /**
   * Compare a plain-text password against a stored hash
   * @async
   * @param {string} providedPassword  - Raw password to verify
   * @param {string} hashedPassword    - Stored bcrypt hash
   * @returns {Promise<boolean>} True if passwords match
   */
  async comparePassword(providedPassword, hashedPassword) {
    return await this.secRepository.comparePassword(providedPassword, hashedPassword)
  }

  /**
   * Generate a signed JWT for an authenticated user
   *
   * Builds a payload with `id` and `email`, then delegates signing
   * to the security repository.
   *
   * @param {Object} user      - Mongoose user document
   * @param {string} user._id  - User's MongoDB identifier
   * @param {string} user.email - User's email address
   * @returns {string} Signed JWT string
   */
  generateAuthToken(user) {
    const payload = { id: user._id, email: user.email };
    return this.secRepository.assignJwt(payload);
  }
}
module.exports = SecurityService