const fs = require('fs/promises');
const path = require('path');

class FileCacheStrategy {
  constructor(options = {}) {
    this._dir = options.dir || path.join(process.cwd(), 'storage', 'cache');
    this.ttl = (options.ttl || 300) * 1000;
    this._init();
  }

  async _init() {
    try { await fs.mkdir(this._dir, { recursive: true }); } catch { /* ok */ }
  }

  _filePath(key) {
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    return path.join(this._dir, safe);
  }

  async get(key) {
    try {
      const stats = await fs.stat(this._filePath(key));
      if (Date.now() - stats.mtimeMs > this.ttl) {
        await fs.unlink(this._filePath(key)).catch(() => {});
        return null;
      }
      const raw = await fs.readFile(this._filePath(key), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async set(key, value, ttl) {
    const data = JSON.stringify(value);
    await fs.writeFile(this._filePath(key), data, 'utf-8');
  }

  async del(key) {
    await fs.unlink(this._filePath(key)).catch(() => {});
  }

  async flush() {
    const files = await fs.readdir(this._dir).catch(() => []);
    await Promise.all(files.map(f => fs.unlink(path.join(this._dir, f)).catch(() => {})));
  }
}

module.exports = FileCacheStrategy;