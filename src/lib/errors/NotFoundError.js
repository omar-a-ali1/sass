/**
 * Not Found Error (404)
 *
 * Thrown when a requested resource does not exist.
 * Used by the fallback route handler for unmatched paths.
 *
 * @module errors/NotFoundError
 */

const AppError = require('./appErrors');

class NotFoundError extends AppError {
  /**
   * @param {string} message - Description of what was not found
   */
  constructor(message) {
    super(message, 404);
  }
}

module.exports = NotFoundError;