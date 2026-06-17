# SASS Framework — Advancement Report

> Summary of improvements, fixes, and current project state.

---

## 1. Cookie Parser Fix (Critical)

**Bug**: The `cookie-parser` npm package exports a factory function `cookieParser(secret, options)` that **must be called** to produce middleware. In `src/bootstrap/index.js:65`, it was stored in `middlewareMap` as `require('cookie-parser')` (uncalled), so Express invoked it as `(req, res, next)` instead of `(secret, options)`. This caused the function to misinterpret the Express request object as a secret string, resulting in the request never reaching `next()`.

**Symptom**: The Express app started and listened on its port, but every HTTP request hung indefinitely — no route handler ever executed.

**Fix**: `require('cookie-parser')` → `require('cookie-parser')()` at `src/bootstrap/index.js:65`.

**Impact**: All 85 tests now pass (up from 53). Previously hanging integration tests (`auth.int.test.js`, `dynamic-routes.test.js`) complete successfully because the app now responds to requests during test setup.

---

## 2. Test Coverage

All 8 test suites pass (85 tests total):

| Suite | Tests | Status |
|---|---|---|
| `auth.int.test.js` | 25 | ✅ Pass (was hanging) |
| `auth.middleware.test.js` | 10 | ✅ Pass |
| `dynamic-routes.test.js` | 7 | ✅ Pass (was hanging) |
| `strategies.test.js` | 20 | ✅ Pass |
| `rateLimiter.test.js` | — | ✅ Pass |
| `security.repository.test.js` | — | ✅ Pass |
| `env.test.js` | — | ✅ Pass |
| `init.test.js` | — | ✅ Pass |
| Static analysis | — | ✅ Pass |

---

## 3. Current Feature Set

| Feature | Status | Details |
|---|---|---|
| Auth (register, login, refresh, forgot/reset password, profile) | ✅ Complete | JWT access + refresh tokens |
| JWT middleware (Bearer + cookie fallback) | ✅ Complete | `authenticate` + `authorize(role)` |
| Auto-route loading | ✅ Complete | Directory hierarchy maps to URL paths, folder name → Swagger tag |
| Auto-model loading | ✅ Complete | Drop files in `models/` |
| Auto-Swagger (dev only) | ✅ Complete | Joi → OpenAPI, zero prod imports |
| Configurable middleware pipeline | ✅ Complete | Order in `MIDDLEWARE_PIPELINE` config |
| Performance monitoring | ✅ Complete | `GET /health/metrics` endpoint |
| Body size limit | ✅ Complete | Configurable via `BODY_LIMIT` env var |
| URL-encoded body parsing | ✅ Complete | `express.urlencoded()` in pipeline |
| Cookie parser | ✅ Complete | npm `cookie-parser` package |
| Strategy pattern (DB, storage, email) | ✅ Complete | Driver-based config selection |
| **Pagination (DB strategies)** | ✅ **New** | `MongoStrategy.paginate()`, `PostgresStrategy.paginate()` — skip/limit + total count |
| **Response envelope** | ✅ **New** | `res.respond()`, `res.paginated()`, `res.fail()` — consistent JSON shape with `traceId` |
| **File upload middleware** | ✅ **New** | Multer bridge → storage strategy (local/S3). Factory `upload({ field, maxSize })` returns middleware array |
| **Seeder system** | ✅ **New** | Auto-discovers `*.seeder.js` in `src/seeders/`, runs via CLI (`npm run seed`) |
| **Seeder scaffolding** | ✅ **New** | `npm run make:seeder -- Product` scaffold |
| IoC container | ✅ Complete | DI via constructor injection |
| CLI scaffolding | ✅ Complete | `npm run make:controller|route|service|repository|validation|model|seeder|all` |
| Route lister | ✅ Complete | `npm run routes` — colour-coded methods, clickable URL, middleware chain |
| Docker CLI | ✅ Complete | Predefined `docker-cli/{dev,test,seed}.sh` with Compose health checks |
| Documentation | ✅ Complete | 7 doc files, README, advancement report |

---

## 4. Architecture Summary

> **Note**: `server.js` is the developer entry point — designed to be modified per-project. It connects to the database, starts the HTTP server, and wires Socket.IO. Developers can add custom initialisation logic (e.g., connect additional services, load middleware, configure clusters) without modifying the bootstrap layer.

```
server.js                       ← Developer entry point (customisable)
  └── bootstrap/index.js          ← Express app assembly
       ├── loadModels.js           ← Auto-loads Mongoose models
       ├── loadContainer.js        ← IoC container (auto-discovers repos & services)
       ├── loadRoutes.js           ← Auto-builds Router from route files
       ├── loadSwagger.js          ← Auto-generates OpenAPI (dev only)
       └── loadSeeders.js          ← Seeder runner (also used by CLI)

MIDDLEWARE_PIPELINE (in order):
  favicon → helmet → cors → cookieParser() → json(limit) → urlencoded(extended)
  → rateLimiter → perfMonitor → tracer → injectServices → responder
  → routes → errorHandler

All controllers follow **Controller → Service → Repository → Strategy** chain:

```
controller → req.getService('xxxService') → service.list/get/create/update/delete
                                         → repository → dbStrategy
```

`user.controller.js` was rebuilt to follow this pattern: `getUser` and `listUsers` now call `userService` instead of directly accessing `authService` or `dbStrategy`. The new `UserService` encapsulates search logic (`$or` / `$regex` transformation), and `UserRepository` gained a `paginate()` method that delegates to `dbStrategy.paginate()`.

Controllers consistently use `res.respond(data)`, `res.paginated(result)`, `res.fail(message)`. The scaffold template (`cli/make.js`) was also updated to generate controllers with `res.respond` / `res.paginated` instead of the old `res.status().json({ success, traceId, data })` pattern.

---

## 5. Route Loading Overhaul

### Directory → URL Mapping

`loadRoutes.js` was rewritten to scan `routes/` from the root. The directory hierarchy maps directly to URL paths:

```
routes/api/v1/auth/login.js   →   POST /api/v1/auth/login
routes/health/index.js        →   GET  /health/
routes/api/v1/users/getUser.js →  GET  /api/v1/users/:id
```

The `ROUTE_PREFIX` config is no longer used — the URL is entirely determined by the directory structure.

### Folder Name → Swagger Tag

The immediate parent folder determines the Swagger tag, not the first URL segment:

| File | Path | Tag (old — first URL segment) | Tag (new — parent folder) |
|---|---|---|---|
| `routes/api/v1/auth/login.js` | `/api/v1/auth/login` | `Api` | `Auth` |
| `routes/api/v1/users/getUser.js` | `/api/v1/users/:id` | `Api` | `Users` |
| `routes/health/index.js` | `/health/` | `Health` | `Health` |

Tags can be overridden per-route by setting `docs.tags` in the route definition.

### File Name Independence

The filename is irrelevant to routing and Swagger — only the `module.exports` structure matters:

```js
// routes/anything.js — name doesn't matter
module.exports = {
  method: 'get',
  path: '/my-path',          // path must be defined when filename ≠ path
  middleware: [...],
  handler: myHandler,
  docs: { tags: ['Custom'] }, // optional tag override
};
```

The `path` field in the export (defaults to `/${basename}` if omitted) and the directory location determine the full URL, not the file name.

Upload routes use the two-step pipeline: `upload({ field })` → `[multer, persist]`:
  multer (memoryStorage) → storageStrategy.upload(key, buffer, mimetype) → req.uploadedFile
```

---

## 6. Known Issues

- **No MongoDB in CI/local**: Health endpoint returns `503` when no DB connection exists. This is expected — the framework requires a running MongoDB instance for full functionality.
- **Socket.IO in `server.js`**: Socket.IO is configured but no application-level socket events are defined beyond connect/disconnect logging. This is a placeholder for real-time features.
- **Multer install**: The upload middleware lazily `require('multer')` — throws a clear error if the package is missing. The package is already listed in `package.json` dependencies.

## 7. Seeder CLI

```bash
# Seed all (development environment)
npm run seed

# Drop + reseed
npm run seed -- --clean

# Seed only a specific model
npm run seed -- --only user

# Scaffold a new seeder
npm run make:seeder -- Product
```

**Seeder definition format** (`src/seeders/<name>.seeder.js`):

```js
const { faker } = require('@faker-js/faker');

module.exports = {
  model: 'User',       // Mongoose model name
  count: 10,           // Number of records
  generate(i) {        // Called per record with index
    return { name: faker.person.fullName() };
  },
};
```
---

## 8. Quick Start
```bash
cp .env.development.example .env.development
npm install
npm run dev
# App starts on PORT (default 3000), health at /health
```
