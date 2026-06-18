const fs = require('fs');
const path = require('path');
const DependencyContainer = require('./container');
const config = require('../config/environment');

// ── Resolve constructor dependencies by parameter name ──
function resolveDeps(ctor, container) {
  const paramNames = extractParamNames(ctor);
  const deps = {};
  let allResolved = true;
  for (const name of paramNames) {
    if (container.has(name)) {
      deps[name] = container.get(name);
    } else {
      allResolved = false;
    }
  }
  return { deps, allResolved };
}

function extractParamNames(ctor) {
  const str = ctor.toString();
  const arrowMatch = str.match(/^\s*\(([^)]*)\)\s*=>/);
  if (arrowMatch) return arrowMatch[1].split(',').map(s => s.trim()).filter(Boolean);

  const match = str.match(/constructor\s*\(([^)]*)\)/);
  if (!match) return [];
  return match[1].split(',').map(s => s.replace(/^\{|\}$/g, '').trim()).filter(Boolean);
}

// ── File conventions ──
const REPO_SUFFIX = '.repository.js';
const SERVICE_SUFFIX = 'Service.js';
const EXCLUDED = ['container.js'];

function scanFiles(dir, suffix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(suffix) && !EXCLUDED.includes(f))
    .map(f => ({
      name: f.replace(suffix, '').replace(/-/g, '').replace(/_/g, ''),
      // services: userService.js → name is "user"
      // repositories: user.repository.js → name is "user"
      // We prepend the type suffix in registerName
      filePath: path.join(dir, f),
    }));
}

function registerName(base, type) {
  const camel = base.replace(/^./, c => c.toLowerCase());
  // user → userRepository / userService
  // auth → authService
  // security → securityRepository / securityService
  return camel + type;
}

const container = new DependencyContainer();

// ── 1. Strategies (manual — depend on config) ──

const MongoStrategy = require('../strategies/database/mongo.strategy');
const PostgresStrategy = require('../strategies/database/postgres.strategy');
const LocalStorageStrategy = require('../strategies/storage/localStorage.strategy');
const S3StorageStrategy = require('../strategies/storage/s3Storage.strategy');
const ConsoleEmailStrategy = require('../strategies/email/consoleEmail.strategy');
const SmtpEmailStrategy = require('../strategies/email/smtpEmail.strategy');
const StubEmailStrategy = require('../strategies/email/stubEmail.strategy');

const dbDrivers = {
  mongo: () => new MongoStrategy(),
  postgres: () => new PostgresStrategy(),
};
container.register('dbStrategy', (dbDrivers[config.database.driver] || dbDrivers.mongo)());

const storageDrivers = {
  local: () => new LocalStorageStrategy({ uploadDir: config.storage.uploadDir, baseUrl: config.storage.baseUrl }),
  s3: () => new S3StorageStrategy({ bucket: config.storage.s3Bucket, region: config.storage.s3Region }),
};
container.register('storageStrategy', (storageDrivers[config.storage.driver] || storageDrivers.local)());

const emailDrivers = {
  console: () => new ConsoleEmailStrategy(),
  smtp: () => new SmtpEmailStrategy(),
  stub: () => new StubEmailStrategy(),
};
container.register('emailStrategy', (emailDrivers[config.email.driver] || emailDrivers.console)());

// ── 2. Auto-discover repositories ──

const reposDir = path.join(__dirname, '..', 'repositories');
for (const file of scanFiles(reposDir, REPO_SUFFIX)) {
  const RepoClass = require(file.filePath);
  const { deps } = resolveDeps(RepoClass, container);
  const name = registerName(file.name, 'Repository');
  container.register(name, new RepoClass(deps));
}

// ── 3. Auto-discover services (multi-pass dependency resolution) ──

const servicesDir = path.join(__dirname, '..', 'services');
const pending = scanFiles(servicesDir, SERVICE_SUFFIX).map(file => ({
  name: registerName(file.name, 'Service'),
  Class: require(file.filePath),
}));

while (pending.length) {
  const remaining = [];
  for (const { name, Class } of pending) {
    const { deps, allResolved } = resolveDeps(Class, container);
    if (allResolved) {
      container.register(name, new Class(deps));
    } else {
      remaining.push({ name, Class });
    }
  }
  if (remaining.length === pending.length) break;
  pending.length = 0;
  pending.push(...remaining);
}

if (pending.length) {
  console.warn('[container] Unresolved services:', pending.map(p => p.name).join(', '));
}

module.exports = container;
