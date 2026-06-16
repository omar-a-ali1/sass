const AppError = require('./appErrors');

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

module.exports = ForbiddenError;