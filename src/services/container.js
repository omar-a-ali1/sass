/**
 * Dependency Injection Container
 *
 * A simple Map-based IoC container that manages service lifecycle.
 * Services are registered at startup with their dependencies injected
 * via constructor, then retrieved by name at runtime through middleware.
 *
 * @module services/container
 */

const config = require('../config/environment');

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

// ---------- Strategy Registration ----------

const MongoStrategy = require('../strategies/database/mongo.strategy');
const PostgresStrategy = require('../strategies/database/postgres.strategy');
const LocalStorageStrategy = require('../strategies/storage/localStorage.strategy');
const S3StorageStrategy = require('../strategies/storage/s3Storage.strategy');
const ConsoleEmailStrategy = require('../strategies/email/consoleEmail.strategy');
const StubEmailStrategy = require('../strategies/email/stubEmail.strategy');

/** Database strategy — selected by config.database.driver */
const dbDrivers = {
  mongo: () => new MongoStrategy(),
  postgres: () => new PostgresStrategy(),
};
const dbStrategy = (dbDrivers[config.database.driver] || dbDrivers.mongo)();
container.register('dbStrategy', dbStrategy);

/** Storage strategy — selected by config.storage.driver */
const storageDrivers = {
  local: () => new LocalStorageStrategy({
    uploadDir: config.storage.uploadDir,
    baseUrl: config.storage.baseUrl
  }),
  s3: () => new S3StorageStrategy({
    bucket: config.storage.s3Bucket,
    region: config.storage.s3Region,
  }),
};
const storageStrategy = (storageDrivers[config.storage.driver] || storageDrivers.local)();
container.register('storageStrategy', storageStrategy);

/** Email strategy — selected by config.email.driver */
const emailDrivers = {
  console: () => new ConsoleEmailStrategy(),
  smtp: () => new StubEmailStrategy(),
};
const emailStrategy = (emailDrivers[config.email.driver] || emailDrivers.console)();
container.register('emailStrategy', emailStrategy);

// ---------- Repository Registration ----------

const UserRepository = require('../repositories/user.repository');
const SecurityRepository = require('../repositories/security.repository')

/** SecurityRepository handles crypto/JWT (not DB-dependent) */
const SecRepo = new SecurityRepository();
container.register('securityRepository', SecRepo);

/** UserRepository receives the database strategy */
const userRepo = new UserRepository({ dbStrategy: container.get('dbStrategy') });
container.register('userRepository', userRepo);

// ---------- Service Registration ----------

const AuthService = require('./authService')
const SecurityService = require('./securityService')

/** SecurityService handles hashing, comparison, and token generation */
const secService = new SecurityService({
  secRepository: container.get('securityRepository')
});
container.register('securityService', secService);

/** AuthService orchestrates registration, login, and password-reset business logic */
const authService = new AuthService({
  securityService: container.get('securityService'),
  userRepository: container.get('userRepository'),
  emailStrategy: container.get('emailStrategy')
});
container.register('authService', authService);

module.exports = container;