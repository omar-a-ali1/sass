const User = require('../models/User');
class UserRepository 
{
  async findAll()
  {
    return await User.findMany();
  }
  async  findById(id)
  {
    return await User.findById(id);
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