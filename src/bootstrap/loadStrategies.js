const config = require('../config/environment');

const MongoStrategy       = require('../lib/strategies/database/mongo.strategy');
const PostgresStrategy    = require('../lib/strategies/database/postgres.strategy');
const LocalStorageStrategy = require('../lib/strategies/storage/localStorage.strategy');
const S3StorageStrategy   = require('../lib/strategies/storage/s3Storage.strategy');
const ConsoleEmailStrategy = require('../lib/strategies/email/consoleEmail.strategy');
const SmtpEmailStrategy   = require('../lib/strategies/email/smtpEmail.strategy');
const StubEmailStrategy   = require('../lib/strategies/email/stubEmail.strategy');
const MemoryCacheStrategy = require('../lib/strategies/cache/memoryCache.strategy');
const FileCacheStrategy   = require('../lib/strategies/cache/fileCache.strategy');
const RedisCacheStrategy  = require('../lib/strategies/cache/redisCache.strategy');

function loadStrategies(container) {
  const dbDrivers = {
    mongo:    () => new MongoStrategy(),
    postgres: () => new PostgresStrategy(),
  };
  container.register('dbStrategy', (dbDrivers[config.database.driver] || dbDrivers.mongo)());

  const storageDrivers = {
    local: () => new LocalStorageStrategy({ uploadDir: config.storage.uploadDir, baseUrl: config.storage.baseUrl }),
    s3:    () => new S3StorageStrategy({ bucket: config.storage.s3Bucket, region: config.storage.s3Region }),
  };
  container.register('storageStrategy', (storageDrivers[config.storage.driver] || storageDrivers.local)());

  const emailDrivers = {
    console: () => new ConsoleEmailStrategy(),
    smtp:    () => new SmtpEmailStrategy(),
    stub:    () => new StubEmailStrategy(),
  };
  container.register('emailStrategy', (emailDrivers[config.email.driver] || emailDrivers.console)());

  const cacheDrivers = {
    memory: () => new MemoryCacheStrategy({ ttl: config.cache.ttl }),
    file:   () => new FileCacheStrategy({ ttl: config.cache.ttl }),
    redis:  () => new RedisCacheStrategy({ ttl: config.cache.ttl, redisUrl: config.cache.redisUrl, prefix: config.cache.redisPrefix }),
  };
  container.register('cacheStrategy', (cacheDrivers[config.cache.driver] || cacheDrivers.memory)());
}

module.exports = loadStrategies;