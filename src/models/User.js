const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const salt = require('../config/environment').bcrypt.salt

const schema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  
})
// default hashing for security reason 
// notice : after  complete the sec service i will remove it !!!
// schema.pre('save', async function (next) {

//   if (!this.isModified('password')) {
//     return;
//   }
//   this.password =  bcrypt.hash(this.password, salt);
    
// });
const User = mongoose.model('User',schema)

module.exports = User