const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const env = require('../config/environment')

class SecurityRepository {
  async hash(entering)
  {
    return await bcrypt.hash(entering, env?.bcrypt?.salt?? 12 )
  }
  async assignJwt(payload,ttl)
  {
    return jwt.sign(payload,ttl)
  }
}