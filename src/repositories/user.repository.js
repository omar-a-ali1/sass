/**
 * User Repository
 *
 * Data-access layer for the User model. Delegates all database
 * operations to the injected database strategy, making the
 * repository agnostic of the underlying engine (MongoDB, PostgreSQL).
 *
 * @module repositories/user.repository
 */

class UserRepository
{
  /**
   * @param {Object} deps
   * @param {Object} deps.dbStrategy - Database strategy instance (e.g. MongoStrategy)
   */
  constructor({ dbStrategy }) {
    this.db = dbStrategy;
  }

  /**
   * Retrieve all users
   * @async
   * @returns {Promise<Array>} Array of all user documents
   */
  async findAll()
  {
    return await this.db.find('User');
  }

  /**
   * Find a user by their database ID
   * @async
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} User document or null
   */
  async findById(id)
  {
    return await this.db.findById('User', id);
  }

  /**
   * Find a user by email address
   * @async
   * @param {string} email - Email address to look up
   * @returns {Promise<Object|null>} User document or null
   */
  async findByEmail(email)
  {
    return await this.db.findOne('User', { email });
  }

  /**
   * Create a new user document
   * @async
   * @param {Object} userData - User payload (name, email, password)
   * @returns {Promise<Object>} The created user document
   */
  async create(userData)
  {
    return await this.db.create('User', userData);
  }
}

module.exports = UserRepository