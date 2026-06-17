/**
 * PostgreSQL Strategy
 *
 * Concrete database strategy using the `pg` library.
 * Requires the `pg` npm package at runtime — install with:
 *   npm install pg
 *
 * Connection is established lazily on the first query.
 * Each method maps to the MongoStrategy interface so the
 * repository layer remains driver-agnostic.
 *
 * @module strategies/database/postgres
 */

class PostgresStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.connectionString] - PostgreSQL connection URI
   */
  constructor(options = {}) {
    this.connectionString = options.connectionString || process.env.POSTGRES_URI;
    /** @type {import('pg').Pool|null} */
    this._pool = null;
  }

  /**
   * Lazily initialise the pg Pool
   *
   * @returns {Promise<import('pg').Pool>}
   */
  async _getPool() {
    if (!this._pool) {
      const { Pool } = require('pg');
      this._pool = new Pool({ connectionString: this.connectionString });
      await this._pool.connect();
    }
    return this._pool;
  }

  /**
   * Map a model name to its table name (convention: pluralised)
   * @param {string} model - e.g. 'User'
   * @returns {string} e.g. 'users'
   */
  _table(model) {
    return model.toLowerCase() + 's';
  }

  /**
   * Build a WHERE clause from a flat query object
   * @param {Object} query - e.g. { email: 'a@b.com', active: true }
   * @returns {{ clause: string, values: Array }} e.g. { clause: 'WHERE email = $1 AND active = $2', values: ['a@b.com', true] }
   */
  _where(query) {
    const keys = Object.keys(query);
    if (keys.length === 0) return { clause: '', values: [] };
    const clause = 'WHERE ' + keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    return { clause, values: Object.values(query) };
  }

  /**
   * Find a single row matching query
   * @param {string} model - Model / table name
   * @param {Object} query - Column filters
   * @returns {Promise<Object|null>}
   */
  async findOne(model, query) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `SELECT * FROM ${this._table(model)} ${clause} LIMIT 1`;
    const { rows } = await pool.query(text, values);
    return rows[0] || null;
  }

  /**
   * Find a row by primary key (assumes `id` column)
   * @param {string} model
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async findById(model, id) {
    const pool = await this._getPool();
    const text = `SELECT * FROM ${this._table(model)} WHERE id = $1 LIMIT 1`;
    const { rows } = await pool.query(text, [id]);
    return rows[0] || null;
  }

  /**
   * Find rows matching optional query
   * @param {string} model
   * @param {Object} [query={}]
   * @returns {Promise<Array>}
   */
  async find(model, query = {}) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `SELECT * FROM ${this._table(model)} ${clause}`;
    const { rows } = await pool.query(text, values);
    return rows;
  }

  /**
   * Insert a row and return it
   * @param {string} model
   * @param {Object} data - Column-value map
   * @returns {Promise<Object>}
   */
  async create(model, data) {
    const pool = await this._getPool();
    const keys = Object.keys(data);
    const cols = keys.join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const text = `INSERT INTO ${this._table(model)} (${cols}) VALUES (${params}) RETURNING *`;
    const { rows } = await pool.query(text, Object.values(data));
    return rows[0];
  }

  /**
   * Update a row by primary key and return it
   * @param {string} model
   * @param {string|number} id
   * @param {Object} data - Columns to update
   * @returns {Promise<Object|null>}
   */
  async findByIdAndUpdate(model, id, data) {
    const pool = await this._getPool();
    const keys = Object.keys(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const text = `UPDATE ${this._table(model)} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const { rows } = await pool.query(text, [...Object.values(data), id]);
    return rows[0] || null;
  }

  /**
   * Delete rows matching query
   * @param {string} model
   * @param {Object} query
   * @returns {Promise<{deletedCount: number}>}
   */
  async deleteOne(model, query) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `DELETE FROM ${this._table(model)} ${clause}`;
    const { rowCount } = await pool.query(text, values);
    return { deletedCount: rowCount };
  }

  /**
   * Count rows matching optional query
   * @param {string} model
   * @param {Object} [query={}]
   * @returns {Promise<number>}
   */
  async count(model, query = {}) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `SELECT COUNT(*)::int AS count FROM ${this._table(model)} ${clause}`;
    const { rows } = await pool.query(text, values);
    return rows[0].count;
  }
}

module.exports = PostgresStrategy;
