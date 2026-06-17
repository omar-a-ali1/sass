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
  async findAll(query = {})
  {
    return await this.db.find('User', query);
  }

  /**
   * Paginated find with total count
   * @async
   * @param {Object}   query   - MongoDB filter
   * @param {Object}   opts    - Pagination options (page, limit, sort)
   * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async paginate(query = {}, opts = {})
  {
    return await this.db.paginate('User', query, opts);
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

  /**
   * Update a user document by ID
   * @async
   * @param {string} id   - Document ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object|null>} Updated user document or null
   */
  async updateById(id, data)
  {
    return await this.db.findByIdAndUpdate('User', id, data);
  }
}

module.exports = UserRepository