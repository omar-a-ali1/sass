const AppError = require('./appErrors');

class validationError extends AppError
{
  constructor(message)
  {
    super(message,400)
  }
}

module.exports = validationError