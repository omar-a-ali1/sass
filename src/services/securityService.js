
class SecurityService {
  constructor({ secRepository }) {
      this.secRepository = secRepository;
  }
  async hashPassword(password)
  {
    return await this.secRepository.hash(password)
  }
  async comparePassword(providedPassword,hashedPassword)
  {
      return  await this.secRepository.comparePassword(providedPassword,hashedPassword)
  }
  generateAuthToken(user) {
      const payload = { id: user._id, email: user.email };
      return this.secRepository.assignJwt(payload);
    }
  
}
module.exports = SecurityService