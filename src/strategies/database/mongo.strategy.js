/**
 * MongoDB Strategy
 *
 * Concrete implementation of the database strategy interface
 * using Mongoose. Each method receives a model name string
 * and resolves the registered Mongoose model at runtime.
 *
 * @module strategies/database/mongo
 */

const mongoose = require('mongoose');

class MongoStrategy {
  /**
   * Resolve a Mongoose model by name
   * @param {string} name - Registered model name (e.g. 'User')
   * @returns {import('mongoose').Model} Mongoose model
   */
  _model(name) {
    return mongoose.model(name);
  }

  /**
   * Find a single document matching query
   * @param {string} model - Model name
   * @param {Object} query - Query filter
   * @returns {Promise<Object|null>}
   */
  async findOne(model, query) {
    return this._model(model).findOne(query).lean();
  }

  /**
   * Find a document by ID
   * @param {string} model - Model name
   * @param {string|ObjectId} id - Document ID
   * @returns {Promise<Object|null>}
   */
  async findById(model, id) {
    return this._model(model).findById(id).lean();
  }

  /**
   * Find documents matching query
   * @param {string} model - Model name
   * @param {Object} [query={}] - Query filter
   * @returns {Promise<Array>}
   */
  async find(model, query = {}) {
    return this._model(model).find(query).lean();
  }

  /**
   * Paginated find with total count
   *
   * @param {string}   model              - Model name
   * @param {Object}   [query={}]         - MongoDB filter
   * @param {Object}   [opts]             - Pagination options
   * @param {number}   [opts.page=1]      - Page number (1-indexed)
   * @param {number}   [opts.limit=20]    - Items per page
   * @param {string}   [opts.sort='-createdAt'] - Sort expression
   * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async paginate(model, query = {}, opts = {}) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const sort = opts.sort || '-createdAt';
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this._model(model).find(query).sort(sort).skip(skip).limit(limit).lean(),
      this._model(model).countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * Create a new document
   * @param {string} model - Model name
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(model, data) {
    return this._model(model).create(data);
  }

  /**
   * Find a document by ID and update
   * @param {string} model - Model name
   * @param {string|ObjectId} id - Document ID
   * @param {Object} data - Update payload
   * @returns {Promise<Object|null>} Updated document
   */
  async findByIdAndUpdate(model, id, data) {
    return this._model(model).findByIdAndUpdate(id, data, { new: true }).lean();
  }

  /**
   * Delete documents matching query
   * @param {string} model - Model name
   * @param {Object} query - Query filter
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(model, query) {
    return this._model(model).deleteOne(query);
  }

  /**
   * Count documents matching query
   * @param {string} model - Model name
   * @param {Object} [query={}] - Query filter
   * @returns {Promise<number>}
   */
  async count(model, query = {}) {
    return this._model(model).countDocuments(query);
  }

  /**
   * Verify database connectivity
   * @returns {Promise<boolean>} true if connected
   */
  async verify() {
    return mongoose.connection.readyState === 1;
  }

  async truncate(model) {
    await this._model(model).deleteMany({});
  }

  async insertMany(model, docs) {
    return this._model(model).insertMany(docs);
  }
}


module.exports = MongoStrategy;
