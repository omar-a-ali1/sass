/**
 * Security Repository
 *
 * Low-level data-access for cryptographic and authentication operations.
 * Encapsulates bcrypt hashing/comparison and JWT signing/verification.
 *
 * @module repositories/security.repository
 */

const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const env = require('../config/environment')

class SecurityRepository {
  /**
   * Hash a value using bcrypt
   * @async
   * @param {string} entering - Plain-text value to hash (e.g. password)
   * @returns {Promise<string>} Bcrypt hash string
   */
  async hash(entering)
  {
    return await bcrypt.hash(entering, env?.bcrypt?.salt ?? 12)
  }

  /**
   * Sign a JWT payload
   *
   * Uses the configured secret and expiration from environment.
   * A custom TTL can be provided to override the default.
   *
   * @param {Object} payload   - Data to embed in the token
   * @param {string|null} ttl  - Optional custom expiration (e.g. '1h', '7d')
   * @returns {string} Signed JWT string
   */
  assignJwt(payload, ttl = null)
  {
    return jwt.sign(
      payload,
      env?.jwt?.secret,
      { expiresIn: ttl ?? env?.jwt?.expiresIn }
    );
  }

  /**
   * Compare a plain-text value against a bcrypt hash
   * @async
   * @param {string} providedPassword  - Raw password to verify
   * @param {string} hashedPassword    - Stored bcrypt hash
   * @returns {Promise<boolean>} True if the value matches the hash
   */
  async comparePassword(providedPassword, hashedPassword)
  {
    return await bcrypt.compare(providedPassword, hashedPassword)
  }
}
module.exports = SecurityRepository;
