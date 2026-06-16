/**
 * Conflict Error (409)
 *
 * Thrown when a resource cannot be created because it conflicts
 * with an existing resource (e.g. duplicate email during registration).
 *
 * @module errors/ConflictError
 */

const AppError = require('./appErrors');

class ConflictError extends AppError {
  /**
   * @param {string} message - Description of the conflict
   */
  constructor(message) {
    super(message, 409);
  }
}

module.exports = ConflictError;