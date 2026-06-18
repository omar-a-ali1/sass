/**
 * ApiKey Repository
 *
 * Data-access layer for the ApiKey model. Delegates all database
 * operations to the injected database strategy.
 *
 * @module repositories/apiKey.repository
 */

class ApiKeyRepository
{
  constructor({ dbStrategy }) {
    this.db = dbStrategy;
  }

  async findByPrefix(prefix) {
    return this.db.findOne('ApiKey', { prefix });
  }

  async findById(id) {
    return this.db.findById('ApiKey', id);
  }

  async findByUserId(userId) {
    return this.db.find('ApiKey', { user: userId });
  }

  async create(keyData) {
    return this.db.create('ApiKey', keyData);
  }

  async updateLastUsed(id) {
    return this.db.findByIdAndUpdate('ApiKey', id, { lastUsedAt: new Date() });
  }

  async deactivate(id) {
    return this.db.findByIdAndUpdate('ApiKey', id, { active: false });
  }
}

module.exports = ApiKeyRepository
