# Minimal Framework Keys

> Principles for stripping SASS down to its core without losing structure.

---

## 1. Pick One Backend — Drop the Strategy Pattern

The strategy layer (`src/lib/strategies/`) adds abstraction for pluggable DB, storage, and email drivers. If you only need Mongo + local disk + console log, eliminate the entire directory and call your driver directly.

| Keep | Drop |
|---|---|
| `mongo.strategy.js` | `postgres.strategy.js` |
| `localStorage.strategy.js` | `s3Storage.strategy.js` |
| `consoleEmail.strategy.js` | `smtpEmail.strategy.js`, `stubEmail.strategy.js` |
| Config-driven driver map in `loadContainer.js` | `DB_DRIVER`, `STORAGE_DRIVER`, `EMAIL_DRIVER` env vars |

## 2. Cut the DI Container

Services currently receive dependencies via constructor injection through a central IoC container (`loadContainer.js`). For a minimal setup, services `require()` their deps directly.

```js
// Before (DI)
class UserService {
  constructor({ userRepository }) { this.repo = userRepository; }
}

// After (direct)
const UserRepository = require('../repositories/user.repository');
class UserService {
  constructor() { this.repo = new UserRepository(); }
}
```

This removes `loadContainer.js`, the auto-discovery logic, and the `container.get()` calls in controllers.

## 3. Flatten Route Loading

Kill the filesystem walker in `loadRoutes.js`. Register routes manually in a single file.

```js
// routes/index.js — manual registration
const router = express.Router();
router.post('/auth/register', validate(registerSchema), registerHandler);
router.get('/users/:id', authenticate, getUserHandler);
// ... every route listed here
```

No more `*.route.js` convention, no directory-to-URL mapping, no auto-Swagger generation.

## 4. Strip Optional Middlewares

Every middleware in the pipeline adds startup cost and mental overhead. Remove what you don't use.

| Middleware | Keep if… |
|---|---|
| `favicon` | You have a favicon |
| `helmet` | Production deployment |
| `cors` | Cross-origin clients |
| `cookieParser` | Using cookies for auth |
| `perfMonitor` | Debugging latency |
| `activityLog` | Auditing user actions |
| `csrf` | Cookie-based auth |
| `rateLimiter` | Public-facing API |

## 5. Remove CLI Tooling

The scaffold (`npm run make:*`), route lister (`npm run routes`), seeder, sync, fetch, and model listers are great DX but add 7+ files and ongoing maintenance. Delete `src/tools/cli/` when you know your schema.

## 6. Core Only — What You're Left With

```
src/
  app.js                    Express app
  server.js                 Entry point
  config/environment.js     Env vars (flat, no system.js)
  controllers/              1–3 files
  services/                 1–3 files
  repositories/             1–3 files
  models/                   1–3 Mongoose schemas
  validation/               Joi schemas
  middlewares/auth.js       Auth (if needed)
  routes/index.js           All routes in one file
  lib/utils/                sanitizeData, logger
```

~10 files, no abstractions, full control.
