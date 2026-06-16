/**
 * Unauthorized Error (401)
 *
 * Thrown when authentication is missing, invalid, or expired.
 * Used by the auth service for invalid credentials or missing tokens.
 *
 * @module errors/UnauthorizedError
 */

const AppError = require('./appErrors');

class UnauthorizedError extends AppError
{
  /**
   * @param {string} message - Description of the authentication failure
   */
  constructor(message) {
    super(message, 401)
  }
}
module.exports = UnauthorizedError