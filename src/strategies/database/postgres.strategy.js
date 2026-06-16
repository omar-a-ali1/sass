/**
 * PostgreSQL Strategy (Stub)
 *
 * Placeholder implementing the same database strategy interface
 * as MongoStrategy. Ready to be filled with pg/knex logic when
 * a PostgreSQL backend is needed.
 *
 * @module strategies/database/postgres
 */

class PostgresStrategy {
  async findOne(model, query) {
    throw new Error('PostgreSQL strategy not implemented');
  }

  async findById(model, id) {
    throw new Error('PostgreSQL strategy not implemented');
  }

  async find(model, query = {}) {
    throw new Error('PostgreSQL strategy not implemented');
  }

  async create(model, data) {
    throw new Error('PostgreSQL strategy not implemented');
  }

  async findByIdAndUpdate(model, id, data) {
    throw new Error('PostgreSQL strategy not implemented');
  }

  async deleteOne(model, query) {
    throw new Error('PostgreSQL strategy not implemented');
  }

  async count(model, query = {}) {
    throw new Error('PostgreSQL strategy not implemented');
  }
}

module.exports = PostgresStrategy;
