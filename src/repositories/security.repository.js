const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const env  = require('../config/environment')

class SecurityRepository {
  async hash(entering)
  {
    return await bcrypt.hash(entering, env?.bcrypt?.salt?? 12 )
  }
   assignJwt(payload,ttl=null)
  {
     return jwt.sign(
       payload,
       env?.jwt?.secret,
       { expiresIn: ttl ?? env?.jwt?.expiresIn }
     );
   }
  async comparePassword(providedPassword, hashedPassword )
  {
    return await bcrypt.compare(providedPassword, hashedPassword)
  }
}
module.exports = SecurityRepository;
