const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const schema = mongoose.Schema({
  email: String,
  name: String,
  password: String,
  
})

//  hash pass before every insertion 
schema.pre('save',function next(){
  this.password =  bcrypt.hash(this.password)
  next()
})
const User = mongoose.model('User',schema)

module.exports = User