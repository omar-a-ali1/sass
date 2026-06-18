# SASS Framework — Complete API & Function Reference

---

## Table of Contents

1. [Entry Points](#1-entry-points)
2. [Bootstrap Layer](#2-bootstrap-layer)
3. [Config Layer](#3-config-layer)
4. [Controllers](#4-controllers)
5. [Error Hierarchy](#5-error-hierarchy)
6. [Middleware Pipeline](#6-middleware-pipeline)
7. [Models](#7-models)
8. [Repositories](#8-repositories)
9. [Routes](#9-routes)
10. [Services (IoC Container)](#10-services)
11. [Strategies](#11-strategies)
12. [Swagger / OpenAPI](#12-swagger--openapi)
13. [CLI Tools](#13-cli-tools)
14. [Utils](#14-utils)
15. [Validation Schemas](#15-validation-schemas)
16. [Tests](#16-tests)

---

## 1. Entry Points

### `server.js` — HTTP Server Bootstrap

**Purpose**: Application entry point. Creates HTTP server, attaches Socket.IO, connects to MongoDB, and starts listening.

| Function | Description |
|---|---|
| `startServer()` | Async IIFE. Calls `connectDB()`, creates `http.Server(app)`, instantiates Socket.IO with CORS config, logs socket connect/disconnect events, stores `io` on app via `app.set('io', io)`, starts listening on `config.port`. Logs environment badge with DB URI and JWT expiry. |

**Socket.IO Events**:
- `connection` — Logs `Socket connected successfully: [ID: ${socket.id}]`
- `disconnect` — Logs `Socket disconnected: [ID: ${socket.id}] - Reason: ${reason}`

### `src/app.js` — Express App Assembly

**Purpose**: Thin re-export of the bootstrapped application from `src/bootstrap/index.js`.

---

## 2. Bootstrap Layer

### `src/bootstrap/index.js` — Bootstrap Orchestrator

**Purpose**: Central orchestrator that wires the entire framework:

1. Auto-loads Mongoose models via `loadModels.js`
2. Initializes the IoC container (strategies → repos → services)
3. Auto-builds the API router via `loadRoutes.js`
4. Auto-generates Swagger doc via `loadSwagger.js`
5. Creates Express app with **configurable middleware pipeline**
6. Mounts routes and error handler

**Middleware pipeline**: Iterates `MIDDLEWARE_PIPELINE` array from config, looks up each key in `middlewareMap`, calls `app.use()` in order.

| Pipeline key | Source | Purpose |
|---|---|---|
| `favicon` | `serve-favicon` | Serves favicon |
| `helmet` | `helmet()` | Security headers |
| `cors` | `cors(corsOptions)` | CORS |
| `cookieParser` | `cookie-parser()` | Parse `Cookie` header → `req.cookies` |
| `json` | `express.json({ limit })` | Body parsing with configurable size limit |
| `urlencoded` | `express.urlencoded({ extended, limit })` | Form body parsing |
| `responder` | `middlewares/responder` | Attaches `res.respond()`, `res.paginated()`, `res.fail()` |
| `rateLimiter` | `express-rate-limit` | Global rate limiter |
| `perfMonitor` | `middlewares/perfMonitor` | Response time tracking, metrics collection |
| `tracer` | `middlewares/tracer` | Request ID + Morgan HTTP logging |
| `injectServices` | `middlewares/injectServices` | Attaches IoC container to `req` |

**Route mounts**: `/` (welcome), `/api-docs` (Swagger UI), `/health/**` (auto-loaded), `/api/*` (auto-loaded), fallback (404), errorHandler.

### `src/bootstrap/loadModels.js` — Model Auto-Loader

| Export | Description |
|---|---|
| `models` | Array of loaded Mongoose model names |
| `modelSchemas` | Object of OpenAPI schemas auto-generated from Mongoose models via `mongoose-to-swagger` |

Scans `src/models/` for `.js` files, `require()`s each one. Each model's `mongoose.model()` call registers it globally.

### `src/bootstrap/loadSeeders.js` — Seeder Auto-Loader

| Export | Description |
|---|---|
| `run(options)` | Discovers `*.seeder.js` files in `src/seeders/`, runs each. `options.clean` drops collections first. `options.only` filters to a single seeder. Accepts optional `strategy` for driver-aware mode. |
| `runSeedersPg(seeders, { clean, strategy })` | Runs seeders using strategy methods: `strategy.truncate(model)` + `strategy.insertMany(model, docs)`. |
| `discoverSeeders(only)` | Returns `[{ name, def }]` for each seeder file. |

When a `strategy` option is passed, seeders use `truncate()` + `insertMany()` on the strategy (used by PostgresStrategy). Without a strategy, seeders use Mongoose model directly (MongoDB mode).

Each seeder file exports `{ model, count, generate(i) }`. Ran automatically in dev via `server.js` after DB connect.

### `src/bootstrap/loadRoutes.js` — Route Auto-Loader

| Export | Description |
|---|---|
| `collectRoutes(dir)` | Recursively scans directory, collects route definitions into an array |
| `buildRouter(dir)` | Calls `collectRoutes` and registers each definition on an Express Router |
| `Router` | Pre-built router (auto-loaded at import time) |

**Route definition discovery**: Each file must export `{ method, path, middleware, handler }`. The loader:
- Reads the directory path as the URL base
- Appends `path` from the export
- Supports `:id` style path params
- Auto-detects `_validationSchema` (body) and `_queryValidationSchema` (query) on middleware

Scan dir: `routes/` root — directory hierarchy maps to URL path (e.g. `routes/api/v1/auth/login.js` → `POST /api/v1/auth/login`).

### `src/bootstrap/loadSwagger.js` — Swagger Auto-Generator

| Export | Description |
|---|---|
| `generatePaths(options)` | Scans route files, builds OpenAPI paths object |
| `pickSuccessDefault(route)` | Returns `{ statusCode: { description } }` — uses the route's own declared `2xx` code if present, else infers from HTTP method |
| `applyStandardErrorRefs(responses, route)` | After user merge, fills in missing standard codes: `400`/`500` always, `401`/`403` when `authenticate` middleware detected |
| `mergeResponses(defaults, user)` | Deep overlay: route's `docs.responses` keys replace matching defaults |

**Auto-detection features:**

| Feature | Detection | Output |
|---|---|---|
| Body schema | `middleware[i]._validationSchema` | `requestBody` with `application/json` |
| Query schema | `middleware[i]._queryValidationSchema` | `parameters` with `in: query` |
| Auth | `middleware[i].name === 'authenticate'` | `security: [{ bearerAuth: [] }, { cookieAuth: [] }]` |
| Path params | `:param` in route path | `parameters` with `in: path` |
| Tag | Parent folder name | e.g. `auth/login.js` → `Auth` |

**Auto-added response codes** (route files no longer need to declare these):

| Code | Component | Added when |
|---|---|---|
| `400` | `ValidationError` | **Every route** |
| `500` | `InternalServerError` | **Every route** |
| `401` | `UnauthorizedError` | Route uses `authenticate` middleware |
| `403` | `ForbiddenError` | Route uses `authenticate` middleware |

Error `$ref`s are applied **after** the user's `docs.responses` merge, so route files only need to declare custom success content and extra codes (404, 409, 503).

Converts `:param` to `{param}` in OpenAPI path keys (e.g. `/users/:id` → `/users/{id}`).

---

## 3. Config Layer

### `src/config/environment.js` — Environment Configuration

| Export | Type | Default | Description |
|---|---|---|---|
| `env` | `string` | `'development'` | Current NODE_ENV |
| `routePrefix` | `string` | `''` | Swagger server URL prefix (no longer used for route loading) |
| `port` | `number` | `3000` | HTTP server port |
| `bodyLimit` | `string` | `'1mb'` | Max JSON body size |
| `database.uri` | `string` | `'mongodb://localhost:27017/myapp_dev'` | MongoDB URI |
| `bcrypt.salt` | `number` | parsed from `BCRPT_SALT_SIZE` | Bcrypt salt rounds |
| `jwt.secret` | `string` | — | JWT signing secret |
| `jwt.expiresIn` | `string` | `'15m'` | Access token expiry |
| `jwt.refreshSecret` | `string` | — | Refresh token secret |
| `jwt.refreshExpiresIn` | `string` | `'7d'` | Refresh token expiry |
| `jwt.resetExpiresIn` | `string` | `'15m'` | Reset-password token expiry |
| `cors.origin` | `string` | `'*'` | Allowed CORS origin |
| `rateLimit.max` | `number` | `null` | Max requests per window |
| `email.driver` | `string` | `'console'` | Email strategy |
| `storage.driver` | `string` | `'local'` | Storage strategy |
| `storage.uploadDir` | `string` | `'storage/uploads'` | Local upload path |

### `src/config/system.js` — System Constants

#### `MIDDLEWARE_PIPELINE`
Ordered array of middleware keys applied globally:
```js
['favicon', 'helmet', 'cors', 'cookieParser', 'json', 'urlencoded', 'rateLimiter', 'perfMonitor', 'tracer', 'injectServices', 'responder']
```

#### `SWAGGER_CONFIG`
```js
{ title: 'SaaS Framework Custom Engine Architecture', version: '1.0.0', description: '...' }
```

#### `PERF_MONITOR_CONFIG`
```js
{ metricsEndpoint: true, trackRoutes: true, histogramBuckets: [5, 10, 25, 50, 100, ...] }
```

#### `SECURITY_DEFAULTS`
| Key | Value |
|---|---|
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `CORS_METHODS` | `['GET','POST','PUT','DELETE','PATCH']` |
| `CORS_ALLOWED_HEADERS` | `['Content-Type','Authorization','X-Request-ID']` |

#### `HTTP_REQUESTS` — Status Code Lookup Table

| Code | Status | Message |
|---|---|---|
| 200 | `success` | The request has succeeded. |
| 201 | `success` | Resource created successfully. |
| 204 | `success` | Operation completed successfully. |
| 400 | `fail` | The data provided is invalid or corrupted. |
| 401 | `fail` | Authentication is required. |
| 403 | `fail` | You do not have permission. |
| 404 | `fail` | The requested resource could not be found. |
| 409 | `fail` | A conflict occurred. |
| 500 | `error` | An unexpected internal server error occurred. |
| 503 | `error` | The server is temporarily unavailable. |

### `src/config/security.js` — Security Middleware Configuration

| Export | Description |
|---|---|
| `helmetConfig` | Pre-configured `helmet()` middleware |
| `rateLimiter` | `express-rate-limit` instance (15min window, configurable max) |
| `corsOptions` | `{ origin, methods, allowedHeaders }` |

### `src/config/database.js` — MongoDB Connection

| Export | Description |
|---|---|
| `connectDB()` | Connects to MongoDB via `mongoose.connect()`. Throws on failure (caller handles exit). |

---

## 4. Controllers

### `src/controllers/auth.controller.js`

| Function | Route | Description |
|---|---|---|
| `register` | `POST /auth/register` | Validated body → `authService.registerUser()` → `201 { success, traceId, data }` |
| `login` | `POST /auth/login` | Validated body → `authService.loginUser()` → `201 { success, traceId, data: { user, accessToken, refreshToken } }` |
| `refresh` | `POST /auth/refresh-token` | Refresh token from body/cookie → `authService.refreshToken()` → `200 { success, traceId, data: { accessToken, refreshToken } }` |
| `forgotPassword` | `POST /auth/forgot-password` | Email → `authService.forgotPassword()` → sends reset email |
| `resetPassword` | `POST /auth/reset-password` | Token + new password → `authService.resetPassword()` |
| `getProfile` | `GET /auth/me` | `req.user.id` → `authService.getProfile()` → `200 { success, traceId, data: user }` |

### `src/controllers/health.controller.js`

| Function | Route | Description |
|---|---|---|
| `checkHealth` | `GET /health` | Returns `{ environment, status, uptime, services: { database }, system: { memory } }`. `503` if DB down. |

### `src/controllers/user.controller.js`

| Function | Route | Description |
|---|---|---|
| `getUser` | `GET /users/:id` | `req.params.id` → `userService.get(id)` |
| `listUsers` | `GET /users` | `req.validatedQuery` → `userService.list(query)` |

---

## 5. Error Hierarchy

```
Error
 └── AppError (base)
      ├── ConflictError       (409)
      ├── NotFoundError       (404)
      ├── ServerError         (500)
      ├── UnauthorizedError   (401)
      ├── ForbiddenError      (403)
      └── ValidationError     (400)
```

### `src/errors/appErrors.js` — Base Error

| Class | Constructor | Description |
|---|---|---|
| `AppError` | `(message, statusCode)` | Looks up default message from `HTTP_REQUESTS`. Sets `statusCode`, `status`, `isOperational = true`. |

**Consistent JSON response shape:**
```json
{ "success": false, "status": "fail", "traceId": "abc-123", "error": { "message": "...", "stack": "(dev only)", "fields": {} } }
```

---

## 6. Middleware Pipeline

### `src/middlewares/errorHandler.js` — Global Error Handler

Catches all errors, defaults to 500, logs appropriately (warn for 4xx, error for 5xx with stack), returns structured JSON.

### `src/middlewares/injectServices.js` — IoC Injection

Attaches `req.container` and `req.getService(name)` helper.

### `src/middlewares/tracer.js` — Request ID & HTTP Logging

Assigns `req.id` from `X-Request-ID` header or random UUID segment. Sets `X-Request-ID` response header. Creates Morgan logger writing to Winston at `http` level.

### `src/middlewares/validation.js` — Joi Validation

| Export | Description |
|---|---|
| `validate(schema)` | Validates `req.body` with `abortEarly: false`. Sets `req.validatedBody` on success. Passes `ValidationError` on failure. Attaches `_validationSchema` for Swagger auto-detect. |
| `validateQuery(schema)` | Validates `req.query` with `allowUnknown: true`. Sets `req.validatedQuery` on success. Attaches `_queryValidationSchema` for Swagger auto-detect. |

### `src/middlewares/auth.js` — JWT Authentication

`authenticate(req, res, next)`: Checks Bearer token from `Authorization` header, falls back to `req.cookies.token`. Verifies via `verifyJwt()`. Sets `req.user = { id, email, role }`. Passes `UnauthorizedError` on failure.

### `src/middlewares/authorize.js` — Role-Based Access

`authorize(allowedRoles)`: Returns middleware that checks `req.user.role` against allowed list. Passes `ForbiddenError` if not authorized. Usage: `authorize('admin')` or `authorize(['admin', 'moderator'])`.

### `src/middlewares/rateLimiter.js` — Per-Route Rate Limiter Factory

`createRateLimiter(options)`: Factory creating Express rate-limit middleware. Options: `{ windowMs, max, message }`. Default: 1-minute window, 10 max.

### `src/middlewares/responder.js` — Response Envelope

Attaches convenience methods to `res`:

| Method | Signature | Description |
|---|---|---|
| `res.respond` | `(data, statusCode = 200)` | `{ success, traceId, data }` |
| `res.paginated` | `(paginatedResult, statusCode = 200)` | `{ success, traceId, data, meta: { total, page, limit, totalPages } }` |
| `res.fail` | `(message, statusCode = 400)` | `{ success: false, traceId, error }` |

### `src/middlewares/upload.js` — File Upload

Factory that returns `[multerMiddleware, persistMiddleware]`:

```js
upload({ field, maxCount, maxSize, allowedMimes, prefix })
```

- Parses `multipart/form-data` via multer (memoryStorage)
- Persists buffer via the registered `storageStrategy`
- Sets `req.uploadedFile` (single) and `req.uploadedFiles` (array)

### `src/middlewares/perfMonitor.js` — Performance Monitoring

| Export | Description |
|---|---|
| `perfMonitor(req, res, next)` | Middleware that tracks total requests, by-route, by-method, by-status, response time histogram, and CPU/memory. Stores metrics at `req.app.locals.metrics`. |
| `collectSnapshot(metrics)` | Builds a human-readable snapshot from raw metrics. |
| `createMetrics()` | Initializes an empty metrics store. |

**Metrics available at** `GET /health/metrics` when `PERF_MONITOR_CONFIG.metricsEndpoint` is `true`. Returns `{ uptime, requests: { total, byMethod, byRoute, byStatus, avgResponseMs }, histogram, system: { memory, loadAvg, cpuUser, cpuSystem } }`.

---

## 7. Models

### `src/models/User.js` — Mongoose User Model

| Field | Type | Description |
|---|---|---|
| `name` | `String` | User's full name |
| `email` | `String` (unique) | Email address |
| `password` | `String` | Hashed password |
| `role` | `String` (default: `'user'`) | Role for authorization |

### Auto-Model Loading

`bootstrap/loadModels.js` scans `src/models/` and auto-registers each model with Mongoose. Additionally converts each to an OpenAPI schema via `mongoose-to-swagger`, accessible via the exported `modelSchemas`.

---

## 8. Repositories

### `src/repositories/user.repository.js`

| Method | Description |
|---|---|
| `findAll(query)` | `dbStrategy.find('User', query)` |
| `findById(id)` | `dbStrategy.findById('User', id)` |
| `findByEmail(email)` | `dbStrategy.findOne('User', { email })` |
| `create(userData)` | `dbStrategy.create('User', userData)` |
| `updateById(id, data)` | `dbStrategy.findByIdAndUpdate('User', id, data)` |
| `paginate(query, opts)` | `dbStrategy.paginate('User', query, opts)` — supports page, limit, sort |

Receives `{ dbStrategy }` via constructor injection.

### `src/repositories/security.repository.js`

| Method | Description |
|---|---|
| `hash(entering)` | `bcrypt.hash(entering, salt)` |
| `assignJwt(payload, ttl)` | Signs access JWT via `jwt.sign()` |
| `assignRefreshJwt(payload, ttl)` | Signs refresh JWT |
| `assignResetJwt(payload, ttl)` | Signs reset-password JWT |
| `comparePassword(provided, hashed)` | `bcrypt.compare()` |

**Standalone exports** (used by auth middleware to avoid circular DI):
| Export | Description |
|---|---|
| `verifyJwt(token)` | Verifies access JWT |
| `verifyRefreshJwt(token)` | Verifies refresh JWT |
| `verifyResetJwt(token)` | Verifies reset-password JWT |

---

## 9. Routes

### Route structure

```
routes/
  ├── health/
  │   ├── index.js              GET     /
  │   └── metrics.js            GET     /metrics
  └── api/v1/
      ├── auth/
      │   ├── login.js             POST    /login
      │   ├── register.js          POST    /register
      │   ├── refresh-token.js     POST    /refresh-token
      │   ├── forgot-password.js   POST    /forgot-password
      │   ├── reset-password.js    POST    /reset-password
      │   └── me.js                GET     /me
      └── users/
          ├── getUser.js           GET     /:id
          └── listUsers.js         GET     /
```

Each file exports `{ method, path, middleware, handler }`. The bootstrap auto-loader recursively scans `routes/` and maps directory hierarchy to URL paths (e.g. `routes/api/v1/auth/login.js` → `POST /api/v1/auth/login`).

### `src/middlewares/fallback.js`

404 catch-all — passes `NotFoundError('route not found [${url}]')`. Mounted after all routes but before errorHandler.

---

## 10. Services

### IoC Container

The container lives in `src/bootstrap/` and is auto-wired:

- **Class**: `src/bootstrap/container.js` — `DependencyContainer` (`register`, `get`, `has`)
- **Orchestrator**: `src/bootstrap/loadContainer.js` — auto-discovers and registers everything

**Registration order**: Strategies (manual) → Repositories (auto) → Services (auto with multi-pass dep resolution).

**Strategies** are manually registered from config-driven driver map:
```js
const DBStrategy = { mongo: MongoStrategy, postgres: PostgresStrategy }[config.database.driver];
const StorageStrategy = { local: LocalStorageStrategy, s3: S3StorageStrategy }[config.storage.driver];
const EmailStrategy = { console: ConsoleEmailStrategy, stub: StubEmailStrategy }[config.email.driver];
```

**Repositories** (`src/repositories/*.repository.js`) are auto-discovered — constructor parameter names are matched to registered strategies.

**Services** (`src/services/*Service.js`) are auto-discovered with multi-pass dependency resolution — if `AuthService` needs `securityService` but `SecurityService` isn't registered yet, the resolver retries until all deps are satisfied or no more progress can be made.

**Registered services**: `dbStrategy`, `storageStrategy`, `emailStrategy`, `securityRepository`, `userRepository`, `securityService`, `userService`, `authService`.

To add a new repository or service, just drop the file in the correct directory — the container picks it up automatically.

### `src/services/authService.js`

| Method | Description |
|---|---|
| `registerUser(data)` | Checks duplicate email → `ConflictError`. Creates user. |
| `loginUser(data)` | Finds user, compares password → `UnauthorizedError`. Returns `{ user, accessToken, refreshToken }`. |
| `refreshToken(token)` | Verifies refresh JWT, generates new token pair. |
| `forgotPassword(email)` | Generates reset JWT, sends email via `emailStrategy`. |
| `resetPassword(token, password)` | Verifies reset JWT, hashes + stores new password. |
| `getProfile(userId)` | Returns user or `NotFoundError`. |

### `src/services/userService.js`

| Method | Description |
|---|---|
| `get(id)` | Returns user or `NotFoundError`. Sanitises output (strips password). |
| `list(query)` | Extracts `{ page, limit, sort, search }`, builds `$or` filter for search, delegates to `userRepository.paginate()`. |

### `src/services/securityService.js`

| Method | Description |
|---|---|
| `hashPassword(password)` | Delegates to `secRepository.hash()` |
| `comparePassword(provided, hashed)` | Delegates to `secRepository.comparePassword()` |
| `generateAuthToken(user)` | Signs access JWT with `{ id, email, role }` |
| `generateRefreshToken(user)` | Signs refresh JWT |
| `generateResetToken(user)` | Signs reset-password JWT (15m expiry) |
| `verifyRefreshToken(token)` | Calls `verifyRefreshJwt()` standalone |

---

## 11. Strategies

### Database Strategies

| Strategy | Status | Methods |
|---|---|---|
| `mongo.strategy.js` | **Full** | `create`, `findById`, `findOne`, `find`, `paginate`, `update`, `delete`, `count`, `truncate`, `insertMany` |
| `postgres.strategy.js` | **Full** | Same interface + `truncate`, `insertMany`; lazy `pg.Pool`, parameterised queries |

### Storage Strategies

| Strategy | Status | Methods |
|---|---|---|
| `localStorage.strategy.js` | **Full** | `upload`, `delete`, `getUrl` (uses `fs/promises`) |
| `s3Storage.strategy.js` | **Full** | Same interface, lazy `@aws-sdk/client-s3` |

### Email Strategies

| Strategy | Status | Methods |
|---|---|---|
| `consoleEmail.strategy.js` | **Full** | `send` — logs to console |
| `stubEmail.strategy.js` | **Stub** | `send` — throws (placeholder) |

All strategy interfaces use `async` methods and receive config via constructor.

---

## 12. Swagger / OpenAPI

### `src/swagger/components/index.js`

| Section | Contents |
|---|---|
| `securitySchemes` | `bearerAuth` (HTTP Bearer), `cookieAuth` (API key in cookie `token`) |
| `responses` | `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `InternalServerError`, `ServiceUnavailableError` |
| `schemas` | Auto-generated from Joi via `joi-to-swagger`, auto-generated from Mongoose models via `mongoose-to-swagger`, plus manual `UserResponse` |

### Auto-Generated from Route Files

Each route's `docs` property + auto-detected schemas produce OpenAPI path definitions. The `generatePaths()` function in `loadSwagger.js` handles all the auto-detection.

---

## 13. CLI Tools

### `cli/list-models.js` — Model Inspector

**Purpose**: Lists every discovered model with its database table/collection and all column types.

| Behaviour | Description |
|---|---|
| PostgreSQL | Queries `information_schema.columns` for real column names, types, nullability, and defaults |
| MongoDB | Reads Mongoose `schema.paths` for field names, types, required flags, and default values |

Outputs a colour-coded table with model name, table name, and per-column details. Auto-detects the active driver from `DB_DRIVER`.

### `cli/fetch.js` — DB Query CLI

**Purpose**: Query database records directly from the command line.

| Option | Description |
|---|---|
| `--id <id>` | Fetch a single record by ID |
| `--where <json>` | Filter conditions (e.g. `'{"role":"admin"}'`) |
| `--limit <n>` | Max records (default: 20) |
| `--page <n>` | Page number (default: 1) |
| `--sort <field>` | Sort field (prefix `-` for desc) |
| `--raw` | Output raw JSON instead of table |

**Output formatting** (table mode):
- Password/token/secret fields masked as `••••••••`
- JSON/JSONB objects serialized inline
- Long strings (>50 chars) truncated with `...`
- Date fields formatted as `2026-06-18 11:28:35`
- Columns auto-fitted to terminal width

### `cli/seed.js` — Seeder Runner

Driver-aware seeder CLI. Detects `DB_DRIVER=postgres`, creates a `PostgresStrategy` with a `pg.Pool`, and passes the `strategy` option to `loadSeeders.run()`.

---

## 14. Utils

### `src/utils/logger.js` — Winston Logger

Levels: `error(0)` `warn(1)` `info(2)` `http(3)` `debug(4)`. Console (all, colorized) + File transports (`error.log`, `warning.log`, `app.log`).

### `src/utils/formatJoiErrors.js`

Maps `joiError.details[]` to `{ fieldName: [cleanedMessages] }`.

### `src/utils/sanitizeData.js`

Strips sensitive fields (`password`, `__v`) from Mongoose docs or plain objects.

Two call modes:

```js
// single document
sanitizeData(user)
sanitizeData(user, ['token', 'secret'])

// inside .map() — extra fields as first arg returns a mapper
users.map(sanitizeData(['token']))
users.map(sanitizeData)           // defaults only
```

### `cookie-parser` (npm package)

The `cookie-parser` npm package is used to parse `Cookie` headers into `req.cookies`. It is invoked via `require('cookie-parser')()` in `bootstrap/index.js`. Note that the factory **must be called** — passing it directly to `app.use()` silently breaks request processing.

---

## 15. Validation Schemas

| File | Fields |
|---|---|
| `auth/register.js` | `name` (string, 2-30), `email` (email), `password` (string, min 8) |
| `auth/login.js` | `email` (email), `password` (string, min 8) |
| `auth/refreshToken.js` | `refreshToken` (string) |
| `auth/forgotPassword.js` | `email` (email) |
| `auth/resetPassword.js` | `token` (string), `password` (string, min 8) |
| `users/list.js` | `page` (1+), `limit` (1-100), `sort` (enum), `search` (string, optional) |

---

## 16. Tests

### Test Suites

| File | Tests | Description |
|---|---|---|
| `auth.int.test.js` | 25 | Full auth flow: register, login, refresh, forgot, reset, me |
| `auth.middleware.test.js` | 10 | Authenticate (5) + authorize (5) |
| `dynamic-routes.test.js` | 7 | Dynamic `:id` (4) + query params (3) |
| `strategies.test.js` | 20 | Mongo (7), LocalStorage (3), Postgres (6), S3Storage (4) |
| `rateLimiter.test.js` | 8 | Rate limiter factory |
| `security.repository.test.js` | 10 | JWT + bcrypt |
| `env.test.js` | 3 | Env loading |
| `init.test.js` | 3 | Bootstrap |
| Static analysis | 14 | Lint-style checks |

Total: **100 tests** across 9 suites.

Run: `npm test` (local) or `bash docker-cli/test.sh` (Docker).
