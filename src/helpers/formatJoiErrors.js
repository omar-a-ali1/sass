/**
 * Joi Error Formatter
 *
 * Converts a Joi validation error into a flat object mapping
 * field names to arrays of human-readable error messages.
 * Quote characters are stripped from messages for cleaner output.
 *
 * @module helpers/formatJoiErrors
 */

/**
 * Format a Joi validation error into a structured field-error map
 *
 * @param {import('joi').ValidationError} joiError - The error object from Joi validation
 * @returns {Object<string, string[]>} e.g. { email: ['email must be a valid email'] }
 */
const formatJoiErrors = (joiError) => {
  const formattedErrors = {};

  joiError.details.forEach((err) => {
    const field = err.path[0];

    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }

    const cleanMessage = err.message.replace(/"/g, '');
    formattedErrors[field].push(cleanMessage);
  });

  return formattedErrors;
};

module.exports = formatJoiErrors;