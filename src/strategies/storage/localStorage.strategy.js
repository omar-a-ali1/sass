/**
 * Local Storage Strategy
 *
 * Stores files on the local filesystem under the configured
 * uploads directory. Provides upload, download, delete, and
 * URL generation for local file access.
 *
 * @module strategies/storage/local
 */

const fs = require('fs');
const path = require('path');

class LocalStorageStrategy {
  /**
   * @param {Object} options
   * @param {string} [options.uploadDir='storage/uploads'] - Base upload directory
   * @param {string} [options.baseUrl='/uploads'] - Public URL prefix
   */
  constructor({ uploadDir = 'storage/uploads', baseUrl = '/uploads' } = {}) {
    this.uploadDir = path.resolve(uploadDir);
    this.baseUrl = baseUrl;
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  /**
   * Upload a file to local storage
   * @param {string} key - File path relative to upload directory
   * @param {Buffer|string} buffer - File content
   * @param {string} [mimetype] - MIME type (not used for local storage)
   * @returns {Promise<string>} The storage key
   */
  async upload(key, buffer, mimetype) {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return key;
  }

  /**
   * Download a file from local storage
   * @param {string} key - File path relative to upload directory
   * @returns {Promise<Buffer>} File content
   */
  async download(key) {
    const filePath = path.join(this.uploadDir, key);
    return fs.readFileSync(filePath);
  }

  /**
   * Delete a file from local storage
   * @param {string} key - File path relative to upload directory
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(key) {
    const filePath = path.join(this.uploadDir, key);
    fs.unlinkSync(filePath);
    return true;
  }

  /**
   * Get the public URL for a stored file
   * @param {string} key - File path relative to upload directory
   * @returns {string} Public URL
   */
  getUrl(key) {
    return `${this.baseUrl}/${key}`;
  }
}

module.exports = LocalStorageStrategy;
