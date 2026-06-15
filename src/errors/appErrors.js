const {HTTP_REQUESTS} = require('../constants/system')
class AppError extends Error
{
  constructor(message, statusCode)
  {
    const defaultMessage = HTTP_REQUESTS[statusCode]?.message || 'An unexpected error occurred.';
    const finalMessage = message || defaultMessage

    super(finalMessage)
    this.statusCode = statusCode;
    this.status = HTTP_REQUESTS[statusCode]?.status || 'error'
    this.isOperational = true;
    Error.prepareStackTrace(this, this.constructor)
  }
}

module.exports = AppError