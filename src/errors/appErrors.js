/**
 * Base Application Error
 *
 * All operational errors inherit from this class. It looks up
 * standard messages and status labels from the HTTP_REQUESTS
 * constant table, producing consistent JSON-serializable errors.
 *
 * @module errors/appErrors
 */

const {HTTP_REQUESTS} = require('../constants/system')

class AppError extends Error
{
  /**
   * @param {string}   message    - Human-readable error description
   * @param {number}   statusCode - HTTP status code (e.g. 400, 404, 500)
   */
  constructor(message, statusCode)
  {
    const defaultMessage = HTTP_REQUESTS[statusCode]?.message || 'An unexpected error occurred.';
    const finalMessage = message || defaultMessage

    super(finalMessage)
    /** @type {number} HTTP status code */
    this.statusCode = statusCode;
    /** @type {string} Status label: 'fail' for 4xx, 'error' for 5xx */
    this.status = HTTP_REQUESTS[statusCode]?.status || 'error'
    /** @type {boolean} Distinguishes expected operational errors from programmer bugs */
    this.isOperational = true;
    Error.prepareStackTrace(this, this.constructor)
  }
}

module.exports = AppError