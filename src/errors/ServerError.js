/**
 * Internal Server Error (500)
 *
 * Thrown when an unexpected condition prevents the server
 * from fulfilling a request.
 *
 * @module errors/ServerError
 */

const AppError = require('./appErrors');

class ServerError extends AppError {
  /**
   * @param {string} message - Description of the server error
   */
  constructor(message) {
    super(message, 500);
  }
}

module.exports = ServerError;
