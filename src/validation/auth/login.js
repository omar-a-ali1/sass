const Joi = require('joi');

const UserLogin = Joi.object({

  email: Joi.string()
    .email()
    .trim()
    .required(),
  password: Joi.string()
    .trim()
    .min(8)
    .required()
})

module.exports  = UserLogin