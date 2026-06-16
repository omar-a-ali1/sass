/**
 * Request Validation Middleware
 *
 * Validates `req.body` against a Joi schema. On failure, formats
 * per-field error messages and passes a ValidationError to the
 * error handler. On success, attaches the cleaned value to
 * `req.validatedBody` for downstream handlers.
 *
 * @module middlewares/validation
 */

const ValidationError = require('../errors/ValidationError');
const formatJoiErrors = require('../helpers/formatJoiErrors');
const { HTTP_REQUESTS } = require('../constants/system');

/**
 * Create a validation middleware for a given Joi schema
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body ?? {}, { abortEarly: false });

  if (error) {
    const details = formatJoiErrors(error);

    const validationError = new ValidationError(HTTP_REQUESTS[400].message);
    validationError.fields = details;

    return next(validationError);
  }

  /** Clean, validated request body available to downstream handlers */
  req.validatedBody = value;
  next();
};

module.exports = validate;