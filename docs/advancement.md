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

All 9 test suites pass (100 tests total):

| Suite | Tests | Status |
|---|---|---|
| `auth.int.test.js` | 25 | ✅ Pass |
| `auth.middleware.test.js` | 10 | ✅ Pass |
| `dynamic-routes.test.js` | 7 | ✅ Pass |
| `strategies.test.js` | 20 | ✅ Pass |
| `rateLimiter.test.js` | 8 | ✅ Pass |
| `security.repository.test.js` | 10 | ✅ Pass |
| `env.test.js` | 3 | ✅ Pass |
| `init.test.js` | 3 | ✅ Pass |
| Static analysis | 14 | ✅ Pass |

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
| **API Key Management** | ✅ **New** | Generate, validate (bcrypt), revoke — with `apiKeyAuth` middleware and API endpoints |
| **Soft Delete** | ✅ **New** | `softDelete()` / `restore()` methods on both database strategies |
| **SMTP Email** | ✅ **New** | Nodemailer-based `SmtpEmailStrategy` — falls back to console log when unconfigured |
| **PG Schema Sync** | ✅ **New** | `npm run sync` — reads Mongoose models and applies only additive changes to PostgreSQL (create tables / add columns) — safe for development |
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

`userService.list()` now maps `sanitizeData` over paginated results so every user in the collection has `password` and `__v` stripped before reaching the response.

---

## 5. sanitizeData — Dual-Mode Sanitizer

`src/utils/sanitizeData.js` was refactored to support two calling conventions:

| Pattern | Usage | When |
|---|---|---|
| Direct | `sanitizeData(doc, ['token'])` | Single doc with extra fields |
| Mapper | `docs.map(sanitizeData(['token']))` | Collection with extra fields |
| Passthrough | `docs.map(sanitizeData)` | Collection, defaults only |

The wrapper detects an array-of-strings first argument and returns a `(doc) => sanitizeData(doc, fields)` closure ready for `.map()`. When called via `.map(sanitizeData)`, the index argument from `.map()` is silently ignored.

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

## 8. Swagger Response Abstraction

The `loadSwagger.js` module was rewritten to separate concerns:

| Function | Role |
|---|---|
| `pickSuccessDefault(route)` | Returns `{ statusCode: { description } }` — uses the route's own `2xx` code if declared, else infers from HTTP method (POST → 201, GET → 200, etc.) |
| `mergeResponses(defaults, user)` | Deep overlay: route's `docs.responses` keys replace matching defaults (or add new codes) |
| `applyStandardErrorRefs(responses, route)` | After merge, fills in any missing standard codes: `400`/`500` always, `401`/`403` when `authenticate` middleware detected |

### Before (route files redundantly specified error refs)

```js
// auth/login.js — 400/401/500 all explicit
responses: {
  201: { ... },
  400: { $ref: '#/components/responses/ValidationError' },
  401: { $ref: '#/components/responses/UnauthorizedError' },
  500: { $ref: '#/components/responses/InternalServerError' },
}
```

### After (route only declares what's special)

```js
// auth/login.js — 401 kept (no authenticate middleware, controller returns 401)
responses: {
  201: { ... },
  401: { $ref: '#/components/responses/UnauthorizedError' },
}
// 400 and 500 auto-added by framework
```

### What each route gets automatically

| Code | When |
|---|---|
| `400` | **Every route** — all endpoints can receive malformed input |
| `500` | **Every route** — all endpoints can crash |
| `401`, `403` | Routes with `authenticate` middleware — detected via `requiresAuth()` |
| `200` or `201` | Always — framework picks the appropriate success code and description; route overrides if it needs custom content |

Routes only need to manually declare:
- Custom success body content (data schema per endpoint)
- Extra codes not in the standard set (`404`, `409`, `503`)

---

## 9. CLI Tools

### `npm run models`

Lists every Mongoose model with its database table/collection and all column types:

```
  Models  (driver: postgres)

  User  → users
  +----+-----------------------------+------+-----------------------------------+
  | column    | type                  | null | default                           |
  +===========+=======================+======+===================================+
  | id        | integer               |      | nextval('users_id_seq'::regclass) |
  | name      | character varying     |      |                                   |
  | email     | character varying     |      |                                   |
  ...
```

**PostgreSQL mode:** queries `information_schema.columns` for real column names, types, nullability, and defaults.
**MongoDB mode:** reads Mongoose `schema.paths` for field names, types, required flags, and default values.

### `npm run fetch`

Query database records directly from the command line:

```bash
npm run fetch -- User
npm run fetch -- User --limit 5
npm run fetch -- User --id 1
npm run fetch -- User --where '{"role":"admin"}'
npm run fetch -- ActivityLog --sort -createdAt --limit 10 --raw
```

**Output features:**
- Passwords and sensitive fields masked (`••••••••`)
- JSON/JSONB objects serialized inline
- Long strings (>50 chars) truncated with `...`
- Dates formatted as `2026-06-18 11:28:35`
- Table layout auto-fit to terminal
- `--raw` flag outputs raw JSON for piping (`jq`, file redirect)

Both tools work with PostgreSQL (`pg.Pool`) and MongoDB (`mongoose`) transparently — automatically using the active driver from `DB_DRIVER`.

---

## 10. Docker CLI Updates

New scripts in `docker-cli/`:

| Script | Command | What it does |
|---|---|---|
| `models.sh` | `bash docker-cli/models.sh` | Show all models and columns from the running dev container |
| `fetch.sh` | `bash docker-cli/fetch.sh User --limit 5` | Query records (passes `$@` through to the container) |

All scripts manage dependency health checks (PostgreSQL + MongoDB must be healthy before the command runs).

---

## 11. Quick Start
```bash
cp .env.development.example .env.development
npm install
npm run dev
# App starts on PORT (default 3000), health at /health
```
