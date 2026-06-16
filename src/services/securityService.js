
class SecurityService {
  constructor({ secRepository }) {
      this.secRepository = secRepository;
  }
  async hashPassword(password)
  {
    return await bcrypt.hash(password, salt);
  }
  
}
module.exports = SecurityService