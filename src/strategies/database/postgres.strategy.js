class PostgresStrategy {
  constructor(options = {}) {
    this.connectionString = options.connectionString || process.env.POSTGRES_URI;
    this._pool = null;
  }

  async _getPool() {
    if (!this._pool) {
      const { Pool } = require('pg');
      this._pool = new Pool({ connectionString: this.connectionString });
      await this._pool.connect();
    }
    return this._pool;
  }

  _table(model) {
    return '"' + model.toLowerCase() + 's"';
  }

  _quote(col) {
    return '"' + col + '"';
  }

  _where(query) {
    const keys = Object.keys(query);
    if (keys.length === 0) return { clause: '', values: [] };
    const clause = 'WHERE ' + keys.map((k, i) => `${this._quote(k)} = $${i + 1}`).join(' AND ');
    return { clause, values: Object.values(query) };
  }

  async findOne(model, query) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `SELECT * FROM ${this._table(model)} ${clause} LIMIT 1`;
    const { rows } = await pool.query(text, values);
    return rows[0] || null;
  }

  async findById(model, id) {
    const pool = await this._getPool();
    const text = `SELECT * FROM ${this._table(model)} WHERE "id" = $1 LIMIT 1`;
    const { rows } = await pool.query(text, [id]);
    return rows[0] || null;
  }

  async find(model, query = {}) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `SELECT * FROM ${this._table(model)} ${clause}`;
    const { rows } = await pool.query(text, values);
    return rows;
  }

  async create(model, data) {
    const pool = await this._getPool();
    const keys = Object.keys(data);
    const cols = keys.map(k => this._quote(k)).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const text = `INSERT INTO ${this._table(model)} (${cols}) VALUES (${params}) RETURNING *`;
    const { rows } = await pool.query(text, Object.values(data));
    return rows[0];
  }

  async findByIdAndUpdate(model, id, data) {
    const pool = await this._getPool();
    const keys = Object.keys(data);
    const setClause = keys.map((k, i) => `${this._quote(k)} = $${i + 1}`).join(', ');
    const text = `UPDATE ${this._table(model)} SET ${setClause} WHERE "id" = $${keys.length + 1} RETURNING *`;
    const { rows } = await pool.query(text, [...Object.values(data), id]);
    return rows[0] || null;
  }

  async deleteOne(model, query) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `DELETE FROM ${this._table(model)} ${clause}`;
    const { rowCount } = await pool.query(text, values);
    return { deletedCount: rowCount };
  }

  async count(model, query = {}) {
    const pool = await this._getPool();
    const { clause, values } = this._where(query);
    const text = `SELECT COUNT(*)::int AS count FROM ${this._table(model)} ${clause}`;
    const { rows } = await pool.query(text, values);
    return rows[0].count;
  }

  async paginate(model, query = {}, opts = {}) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const sortRaw = opts.sort || 'id';
    const desc = sortRaw.startsWith('-');
    const sortCol = this._quote(desc ? sortRaw.slice(1) : sortRaw);
    const dir = desc ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const pool = await this._getPool();
    const { clause, values } = this._where(query);

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM ${this._table(model)} ${clause} ORDER BY ${sortCol} ${dir} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM ${this._table(model)} ${clause}`,
        values,
      ),
    ]);

    return {
      data: dataResult.rows,
      total: countResult.rows[0].count,
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit) || 1,
    };
  }

  async verify() {
    try {
      const pool = await this._getPool();
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async truncate(model) {
    const pool = await this._getPool();
    await pool.query(`DELETE FROM ${this._table(model)}`);
  }

  async insertMany(model, docs) {
    if (!docs.length) return [];
    const pool = await this._getPool();
    const keys = Object.keys(docs[0]);
    const cols = keys.map(k => this._quote(k)).join(', ');
    const values = [];
    const placeholders = docs.map((doc, i) => {
      const offset = i * keys.length;
      keys.forEach((k, j) => { values.push(doc[k]); });
      return '(' + keys.map((_, j) => `$${offset + j + 1}`).join(', ') + ')';
    }).join(', ');
    const text = `INSERT INTO ${this._table(model)} (${cols}) VALUES ${placeholders} RETURNING *`;
    const { rows } = await pool.query(text, values);
    return rows;
  }

  async softDelete(model, id) {
    const pool = await this._getPool();
    const text = `UPDATE ${this._table(model)} SET "deletedAt" = NOW() WHERE "id" = $1 RETURNING *`;
    const { rows } = await pool.query(text, [id]);
    return rows[0] || null;
  }

  async restore(model, id) {
    const pool = await this._getPool();
    const text = `UPDATE ${this._table(model)} SET "deletedAt" = NULL WHERE "id" = $1 RETURNING *`;
    const { rows } = await pool.query(text, [id]);
    return rows[0] || null;
  }
}

module.exports = PostgresStrategy;
