const AppError = require('./appErrors');

class ValidationError extends AppError
{
  constructor(message)
  {
    super(message,400)
  }
}

module.exports = ValidationError