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
   * Sign an access JWT payload
   *
   * Uses the configured secret and default expiration from environment.
   * A custom TTL can be provided to override the default.
   *
   * @param {Object} payload    - Data to embed in the token
   * @param {string} [ttl=null] - Optional custom expiration (e.g. '1h', '7d')
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
   * Sign a refresh JWT payload
   *
   * Uses the separate refresh secret and longer expiration.
   *
   * @param {Object} payload    - Data to embed in the token
   * @param {string} [ttl=null] - Optional custom expiration
   * @returns {string} Signed refresh JWT string
   */
  assignRefreshJwt(payload, ttl = null)
  {
    return jwt.sign(
      payload,
      env?.jwt?.refreshSecret,
      { expiresIn: ttl ?? env?.jwt?.refreshExpiresIn }
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

/**
 * Verify an access JWT and return the decoded payload
 *
 * Standalone function so auth middleware can use it without
 * going through the container.
 *
 * @param {string} token - JWT string to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyJwt = (token) => {
  return jwt.verify(token, env?.jwt?.secret);
};

/**
 * Verify a refresh JWT and return the decoded payload
 *
 * @param {string} token - Refresh JWT string to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshJwt = (token) => {
  return jwt.verify(token, env?.jwt?.refreshSecret);
};

module.exports = SecurityRepository;
module.exports.verifyJwt = verifyJwt;
module.exports.verifyRefreshJwt = verifyRefreshJwt;
