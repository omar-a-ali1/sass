/**
 * S3 Storage Strategy
 *
 * Concrete storage strategy using the AWS SDK v3.
 * Requires the `@aws-sdk/client-s3` npm package at runtime:
 *   npm install @aws-sdk/client-s3
 *
 * @module strategies/storage/s3
 */

class S3StorageStrategy {
  /**
   * @param {Object}  options
   * @param {string}  options.bucket - S3 bucket name
   * @param {string}  [options.region] - AWS region (default: from env or 'us-east-1')
   */
  constructor(options = {}) {
    this.bucket = options.bucket;
    this.region = options.region || process.env.AWS_REGION || 'us-east-1';
    /** @type {import('@aws-sdk/client-s3').S3Client|null} */
    this._client = null;
  }

  /**
   * Lazily initialise the S3 client
   *
   * @returns {Promise<import('@aws-sdk/client-s3').S3Client>}
   */
  async _getClient() {
    if (!this._client) {
      const { S3Client } = require('@aws-sdk/client-s3');
      this._client = new S3Client({ region: this.region });
    }
    return this._client;
  }

  /**
   * Upload a file to S3
   *
   * @param {string}   key      - Object key (path within bucket)
   * @param {Buffer|string} buffer - File content
   * @param {string}   [mimetype] - MIME type
   * @returns {Promise<string>} The object key
   */
  async upload(key, buffer, mimetype) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const client = await this._getClient();

    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ...(mimetype ? { ContentType: mimetype } : {}),
    };

    await client.send(new PutObjectCommand(params));
    return key;
  }

  /**
   * Download an object from S3
   *
   * @param {string} key - Object key
   * @returns {Promise<Buffer>} File content
   */
  async download(key) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const client = await this._getClient();

    const { Body } = await client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));

    return Buffer.from(await Body.transformToByteArray());
  }

  /**
   * Delete an object from S3
   *
   * @param {string} key - Object key
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(key) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const client = await this._getClient();

    await client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));

    return true;
  }

  /**
   * Generate a public URL for a stored object
   *
   * @param {string} key - Object key
   * @returns {string} Public URL (assumes public-read bucket policy)
   */
  getUrl(key) {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

module.exports = S3StorageStrategy;
