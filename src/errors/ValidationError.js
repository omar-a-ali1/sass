/**
 * Validation Error (400)
 *
 * Thrown when request data fails schema validation.
 * Carries a `fields` property with per-field error messages
 * populated by the validation middleware.
 *
 * @module errors/ValidationError
 */

const AppError = require('./appErrors');

class ValidationError extends AppError
{
  /**
   * @param {string} message - General validation failure description
   */
  constructor(message)
  {
    super(message, 400)
    /** @type {Object<string, string[]>|undefined} Per-field validation errors */
    this.fields = undefined;
  }
}

module.exports = ValidationError