/**
 * Dependency Injection Container
 *
 * A simple Map-based IoC container that manages service lifecycle.
 * Services are registered at startup with their dependencies injected
 * via constructor, then retrieved by name at runtime through middleware.
 *
 * @module services/container
 */

class DependencyContainer
{
  constructor()
  {
    /** @type {Map<string, Object>} */
    this.services = new Map()
  }

  /**
   * Register a service instance by name
   * @param {string} name     - Unique service identifier
   * @param {Object} instance - The instantiated service object
   */
  register(name, instance)
  {
    this.services.set(name, instance)
  }

  /**
   * Retrieve a registered service by name
   * @param {string} name - Service identifier
   * @returns {Object} The service instance
   * @throws {Error} If no service is registered with the given name
   */
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

// ---------- Service Registration ----------

const AuthService = require('./authService')
const SecurityService = require('./securityService')
const UserRepository = require('../repositories/user.repository');
const SecurityRepository = require('../repositories/security.repository')

/** SecurityRepository instance (low-level crypto/JWT operations) */
const SecRepo = new SecurityRepository();

/** SecurityService handles hashing, comparison, and token generation */
const secService = new SecurityService({
  secRepository: SecRepo
});
container.register('securityService', secService);

/** UserRepository instance (data access for user documents) */
const userRepo = new UserRepository();

/** AuthService orchestrates registration and login business logic */
const authService = new AuthService({
  securityService: container.get('securityService'),
  userRepository: userRepo
});
container.register('authService', authService);

module.exports = container;