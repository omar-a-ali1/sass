const AppError = require('./appErrors');

class ConflictError extends AppError {
  constructor(message ) {
    super(message, 409);
  }
}

module.exports = ConflictError;