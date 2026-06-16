class DependencyContainer
{
  constructor()
  {
    this.services = new Map()
  }
  register(name, instance)
  {
    this.services.set(name, instance)
  }
  get(name)
  {
    if (!this.services.has(name))
    {
      throw new Error(`Service ${name} not found`)      
    }
    return this.services.get(name)
  }
}

const container = new DependencyContainer();

//register services : 
const AuthService = require('./authService')
const SecurityService = require('./securityService')
// repositories
const UserRepository = require('../repositories/user.repository');
const SecurityRepository = require('../repositories/security.repository')

const SecRepo = new SecurityRepository();

const secService = new SecurityService({
  secRepository:SecRepo
})
container.register('securityService', secService);

const userRepo = new UserRepository();
const authService = new AuthService({
  securityService:container.get('securityService'),
  userRepository: userRepo
});


container.register('authService', authService);
module.exports = container;