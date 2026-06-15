// src/middlewares/validation.js
const ValidationError = require('../errors/validationError');
const formatJoiErrors = require('../helpers/formatJoiErrors');
const { HTTP_REQUESTS } = require('../constants/system');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const details = formatJoiErrors(error);

    const validationError = new ValidationError(HTTP_REQUESTS[400].message);
    validationError.fields = details;

    return next(validationError);
  }

  req.validatedBody = value;
  next();
};

module.exports = validate;