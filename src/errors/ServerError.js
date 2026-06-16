const AppError = require('./appErrors');

class ServerError extends AppError {
  constructor(message ) {
    super(message, 500);
  }
}

module.exports = ServerError;
