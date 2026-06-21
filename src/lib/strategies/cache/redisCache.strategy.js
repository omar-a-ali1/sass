class RedisCacheStrategy {
  constructor(options = {}) {
    this.ttl = (options.ttl || 300);
    this.redisUrl = options.redisUrl || '';
    this.prefix = options.prefix || 'sass:cache:';
    this._ready = false;

    if (this.redisUrl) {
      console.warn('[cache] Redis driver configured but not implemented. Install `ioredis` and implement RedisCacheStrategy.');
    }
  }

  _notReady() {
    if (!this._ready) {
      throw new Error('RedisCacheStrategy not implemented. Install ioredis and implement the connection.');
    }
  }

  async get(key) {
    this._notReady();
  }

  async set(key, value, ttl) {
    this._notReady();
  }

  async del(key) {
    this._notReady();
  }

  async flush() {
    this._notReady();
  }
}

module.exports = RedisCacheStrategy;