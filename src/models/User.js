const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const schema = mongoose.Schema({
  email: String,
  name: String,
  password: String,
  
})

schema.pre('save', async function (next) {

  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
    
});
const User = mongoose.model('User',schema)

module.exports = User