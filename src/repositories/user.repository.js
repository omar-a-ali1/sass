/**
 * User Repository
 *
 * Data-access layer for the User model. Wraps Mongoose operations
 * behind a clean interface so that services never depend on the
 * ODM directly. Swapping the database backend only requires
 * changing this repository and the corresponding strategy.
 *
 * @module repositories/user.repository
 */

const User = require('../models/User');

class UserRepository
{
  /**
   * Retrieve all users
   * @async
   * @returns {Promise<Array>} Array of all user documents
   */
  async findAll()
  {
    return await User.find();
  }

  /**
   * Find a user by their MongoDB _id
   * @async
   * @param {string} id - MongoDB ObjectId string
   * @returns {Promise<Object|null>} User document or null
   */
  async findById(id)
  {
    return await User.findById(id);
  }

  /**
   * Find a user by email address
   * @async
   * @param {string} email - Email address to look up
   * @returns {Promise<Object|null>} User document or null
   */
  async findByEmail(email)
  {
    return await User.findOne({ email });
  }

  /**
   * Create a new user document
   * @async
   * @param {Object} userData - User payload (name, email, password)
   * @returns {Promise<Object>} The created user document
   */
  async create(userData)
  {
    return await User.create(userData)
  }
}

module.exports = UserRepository