const AppError = require('./appErrors');
class UnauthorizedError extends AppError
{
  constructor(message) {
    super(message,401)
  } 
}
module.exports = UnauthorizedError