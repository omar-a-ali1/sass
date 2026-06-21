class MemoryCacheStrategy {
  constructor(options = {}) {
    this._store = new Map();
    this.ttl = (options.ttl || 300) * 1000;
    this._timer = setInterval(() => this._evict(), 60_000);
    this._timer.unref();
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttl) {
    const ms = (ttl || this.ttl / 1000) * 1000;
    this._store.set(key, { value, expiry: Date.now() + ms });
  }

  async del(key) {
    this._store.delete(key);
  }

  async flush() {
    this._store.clear();
  }

  _evict() {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (now > entry.expiry) this._store.delete(key);
    }
  }
}

module.exports = MemoryCacheStrategy;