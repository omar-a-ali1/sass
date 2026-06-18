/**
 * ApiKey Service
 *
 * Generates, validates, and manages API keys. Uses bcrypt to store
 * key hashes so the raw key is only ever returned once at creation.
 *
 * @module services/apiKeyService
 */

const crypto = require('crypto');
const NotFoundError = require('../errors/NotFoundError');

class ApiKeyService
{
  constructor({ apiKeyRepository, securityService, config }) {
    this.apiKeyRepository = apiKeyRepository;
    this.securityService = securityService;
    this.keyPrefix = (config && config.apiKey && config.apiKey.prefix) || 'sass';
  }

  /**
   * Generate a new API key for a user
   *
   * Returns both the persisted record and the one-time raw key value.
   * The raw key is never stored — only a bcrypt hash is persisted.
   *
   * @async
   * @param {string}   userId      - Owner's database ID
   * @param {string}   name        - Human label for this key
   * @param {string[]} [permissions] - Optional permission scopes
   * @returns {Promise<{ apiKey: Object, rawKey: string }>}
   */
  async generateKey(userId, name, permissions = []) {
    const raw = `${this.keyPrefix}_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = raw.substring(0, 12);
    const hashedKey = await this.securityService.hashPassword(raw);

    const doc = await this.apiKeyRepository.create({
      prefix,
      hashedKey,
      name,
      user: userId,
      permissions,
    });

    const apiKey = doc.toObject ? doc.toObject() : { ...doc };
    delete apiKey.hashedKey;

    return { apiKey, rawKey: raw };
  }

  /**
   * Validate a raw API key and return the owning record
   *
   * Extracts the lookup prefix from the key, retrieves the stored
   * hash, and bcrypt-compares. Returns null on any failure (unknown
   * prefix, inactive, expired, hash mismatch).
   *
   * @async
   * @param {string} key - Full raw API key (e.g. "sass_a1b2c3d4...")
   * @returns {Promise<Object|null>} ApiKey document or null
   */
  async validateKey(key) {
    const prefix = key.substring(0, 12);
    const record = await this.apiKeyRepository.findByPrefix(prefix);
    if (!record || !record.active) return null;

    const isValid = await this.securityService.comparePassword(key, record.hashedKey);
    if (!isValid) return null;

    if (record.expiresAt && new Date() > record.expiresAt) return null;

    Promise.resolve(this.apiKeyRepository.updateLastUsed(record._id)).catch(() => {});
    return record;
  }

  /**
   * Revoke (deactivate) an API key by its database ID
   *
   * @async
   * @param {string} id - ApiKey document ID
   * @returns {Promise<Object>} Updated document
   * @throws {NotFoundError} If no key with that ID exists
   */
  async revokeKey(id) {
    const key = await this.apiKeyRepository.findById(id);
    if (!key) throw new NotFoundError('API key not found');
    return this.apiKeyRepository.deactivate(id);
  }

  /**
   * List all non-revoked API keys for a user
   *
   * @async
   * @param {string} userId - Owner's database ID
   * @returns {Promise<Array>} Array of ApiKey documents
   */
  async listKeys(userId) {
    return this.apiKeyRepository.findByUserId(userId);
  }
}

module.exports = ApiKeyService
