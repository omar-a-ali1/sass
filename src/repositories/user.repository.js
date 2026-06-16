const User = require('../models/User');
class UserRepository 
{
  async  findById(id)
  {
    return await User.findOne(id);
  }
  async findByEmail(email)
  {
    return await User.findOne({ email });
  }
  async create(userData)
  {
    return await User.create(userData)
  }
  async hashPassword(pass)
  {
    
  }
  
}

module.exports = UserRepository