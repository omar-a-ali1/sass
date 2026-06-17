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
13. [Utils](#13-utils)
14. [Validation Schemas](#14-validation-schemas)
15. [Tests](#15-tests)

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
| `rateLimiter` | `express-rate-limit` | Global rate limiter |
| `perfMonitor` | `middlewares/perfMonitor` | Response time tracking, metrics collection |
| `tracer` | `middlewares/tracer` | Request ID + Morgan HTTP logging |
| `injectServices` | `middlewares/injectServices` | Attaches IoC container to `req` |

**Route mounts**: `/` (welcome), `/api-docs` (Swagger UI), `/health`, `routePrefix` (API), fallback (404).

### `src/bootstrap/loadModels.js` — Model Auto-Loader

| Export | Description |
|---|---|
| `models` | Array of loaded Mongoose model names |
| `modelSchemas` | Object of OpenAPI schemas auto-generated from Mongoose models via `mongoose-to-swagger` |

Scans `src/models/` for `.js` files, `require()`s each one. Each model's `mongoose.model()` call registers it globally.

### `src/bootstrap/loadRoutes.js` — Route Auto-Loader

| Export | Description |
|---|---|
| `collectRoutes(dir, basePath)` | Recursively scans directory, collects route definitions into an array |
| `buildRouter(dir)` | Calls `collectRoutes` and registers each definition on an Express Router |
| `Router` | Pre-built router (auto-loaded at import time) |
| `routePrefix` | Resolved from config (`ROUTE_PREFIX` env var, default `/api/v1`) |

**Route definition discovery**: Each file must export `{ method, path, middleware, handler }`. The loader:
- Reads the directory path as the URL base
- Appends `path` from the export
- Supports `:id` style path params
- Auto-detects `_validationSchema` (body) and `_queryValidationSchema` (query) on middleware

Scan dir: `routes/{routePrefix}` — mirrors the mount point.

### `src/bootstrap/loadSwagger.js` — Swagger Auto-Generator

| Export | Description |
|---|---|
| `generatePaths(options)` | Scans route files, builds OpenAPI paths object |

**Auto-detection features:**

| Feature | Detection | Output |
|---|---|---|
| Body schema | `middleware[i]._validationSchema` | `requestBody` with `application/json` |
| Query schema | `middleware[i]._queryValidationSchema` | `parameters` with `in: query` |
| Auth | `middleware[i].name === 'authenticate'` | `security: [{ bearerAuth: [] }, { cookieAuth: [] }]` |
| Path params | `:param` in route path | `parameters` with `in: path` |
| Tag | First URL segment | e.g. `/auth/login` → `Auth` |
| Default responses | No `docs.responses` | `400` + `500` refs |

Converts `:param` to `{param}` in OpenAPI path keys (e.g. `/users/:id` → `/users/{id}`).

---

## 3. Config Layer

### `src/config/environment.js` — Environment Configuration

| Export | Type | Default | Description |
|---|---|---|---|
| `env` | `string` | `'development'` | Current NODE_ENV |
| `routePrefix` | `string` | `'/api/v1'` | API route prefix |
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
['favicon', 'helmet', 'cors', 'cookieParser', 'json', 'rateLimiter', 'perfMonitor', 'tracer', 'injectServices']
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
| `connectDB()` | Connects to MongoDB via `mongoose.connect()`. Exits process on failure. |

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
| `getUser` | `GET /users/:id` | `req.params.id` → `userService.getProfile()` |
| `listUsers` | `GET /users` | `req.validatedQuery` → `userService.listUsers()` |

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
| `findById(id)` | `dbStrategy.findById('User', id)` |
| `findByEmail(email)` | `dbStrategy.findOne('User', { email })` |
| `create(userData)` | `dbStrategy.create('User', userData)` |

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

Each file exports `{ method, path, middleware, handler }`. The bootstrap auto-loader handles registration.

### `src/routes/health.js`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | System health (DB status, uptime, memory) |
| `GET` | `/health/metrics` | Performance metrics snapshot |

### `src/routes/defaults/fallback.js`

404 catch-all — passes `NotFoundError('route not found [${url}]')`.

---

## 10. Services

### `src/services/container.js` — IoC Dependency Container

**`DependencyContainer`** class:
| Method | Description |
|---|---|
| `register(name, instance)` | Stores instance by name |
| `get(name)` | Retrieves instance. Throws if not found. |

**Registration order**: Strategies → Repositories → Services. Uses **driver-based selection**:
```js
const DBStrategy = { mongo: MongoStrategy, postgres: PostgresStrategy }[config.database.driver];
const StorageStrategy = { local: LocalStorageStrategy, s3: S3StorageStrategy }[config.storage.driver];
const EmailStrategy = { console: ConsoleEmailStrategy, stub: StubEmailStrategy }[config.email.driver];
```

### `src/services/authService.js`

| Method | Description |
|---|---|
| `registerUser(data)` | Checks duplicate email → `ConflictError`. Creates user. |
| `loginUser(data)` | Finds user, compares password → `UnauthorizedError`. Returns `{ user, accessToken, refreshToken }`. |
| `refreshToken(token)` | Verifies refresh JWT, generates new token pair. |
| `forgotPassword(email)` | Generates reset JWT, sends email via `emailStrategy`. |
| `resetPassword(token, password)` | Verifies reset JWT, hashes + stores new password. |
| `getProfile(userId)` | Returns user or `NotFoundError`. |

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
| `mongo.strategy.js` | **Full** | `create`, `findById`, `findOne`, `find`, `update`, `delete`, `count` |
| `postgres.strategy.js` | **Full** | Same interface, lazy `pg.Pool`, parameterised queries |

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
| `responses` | `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `InternalServerError` |
| `schemas` | Auto-generated from Joi via `joi-to-swagger`, auto-generated from Mongoose models via `mongoose-to-swagger`, plus manual `UserResponse` |

### Auto-Generated from Route Files

Each route's `docs` property + auto-detected schemas produce OpenAPI path definitions. The `generatePaths()` function in `loadSwagger.js` handles all the auto-detection.

---

## 13. Utils

### `src/utils/logger.js` — Winston Logger

Levels: `error(0)` `warn(1)` `info(2)` `http(3)` `debug(4)`. Console (all, colorized) + File transports (`error.log`, `warning.log`, `app.log`).

### `src/utils/formatJoiErrors.js`

Maps `joiError.details[]` to `{ fieldName: [cleanedMessages] }`.

### `src/utils/sanitizeData.js`

Converts Mongoose doc to plain object, removes `password`, `__v`, and optional extra fields.

### `cookie-parser` (npm package)

The `cookie-parser` npm package is used to parse `Cookie` headers into `req.cookies`. It is invoked via `require('cookie-parser')()` in `bootstrap/index.js`. Note that the factory **must be called** — passing it directly to `app.use()` silently breaks request processing.

---

## 14. Validation Schemas

| File | Fields |
|---|---|
| `auth/register.js` | `name` (string, 2-30), `email` (email), `password` (string, min 8) |
| `auth/login.js` | `email` (email), `password` (string, min 8) |
| `auth/refreshToken.js` | `refreshToken` (string) |
| `auth/forgotPassword.js` | `email` (email) |
| `auth/resetPassword.js` | `token` (string), `password` (string, min 8) |
| `users/list.js` | `page` (1+), `limit` (1-100), `sort` (enum), `search` (string, optional) |

---

## 15. Tests

### Test Suites

| File | Tests | Description |
|---|---|---|
| `auth.int.test.js` | 25 | Full auth flow: register, login, refresh, forgot, reset, me |
| `auth.middleware.test.js` | 10 | Authenticate (5) + authorize (5) |
| `dynamic-routes.test.js` | 7 | Dynamic `:id` (4) + query params (3) |
| `strategies.test.js` | 20 | Mongo (7), LocalStorage (3), Postgres (6), S3Storage (4) |
| Other suites | ~23 | Rate limiter, security repository, env, init, static analysis |

Total: **85+ tests** across multiple suites.

Run: `npm test` (local) or `./command/test.sh` (Docker).
