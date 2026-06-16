/**
 * S3 Storage Strategy (Stub)
 *
 * Placeholder implementing the same storage strategy interface
 * as LocalStorageStrategy. Ready to be filled with @aws-sdk/client-s3
 * logic when cloud storage is needed.
 *
 * @module strategies/storage/s3
 */

class S3StorageStrategy {
  /**
   * @param {Object} options
   * @param {string} options.bucket - S3 bucket name
   * @param {string} [options.region] - AWS region
   */
  constructor(options = {}) {
    this.bucket = options.bucket;
  }

  async upload(key, buffer, mimetype) {
    throw new Error('S3 storage strategy not implemented');
  }

  async download(key) {
    throw new Error('S3 storage strategy not implemented');
  }

  async delete(key) {
    throw new Error('S3 storage strategy not implemented');
  }

  getUrl(key) {
    throw new Error('S3 storage strategy not implemented');
  }
}

module.exports = S3StorageStrategy;
