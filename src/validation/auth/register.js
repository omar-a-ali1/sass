const Joi = require('joi');

const RegisterUser = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(30)
    .required(),
  email: Joi.string()
    .email()
    .trim()
    .required(),
  password: Joi.string()
    .trim()
    .min(8)
    .required()  
})


module.exports =RegisterUser