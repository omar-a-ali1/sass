# SASS Framework — Complete API & Function Reference

> **S**calable **A**rchitecture for **S**erver-side **S**ystems

---

## Table of Contents

1. [Entry Points](#1-entry-points)
2. [Config Layer](#2-config-layer)
3. [Constants](#3-constants)
4. [Controllers](#4-controllers)
5. [Error Hierarchy](#5-error-hierarchy)
6. [Helpers](#6-helpers)
   - [formatJoiErrors](#srchelpersformatjoierrorsjs--joi-error-formatter)
   - [sanitizeData](#srchelperssanitizedatajs--data-sanitizer)
7. [Middleware Pipeline](#7-middleware-pipeline)
8. [Models](#8-models)
9. [Repositories](#9-repositories)
10. [Routes](#10-routes)
11. [Services (IoC Container + Business Logic)](#11-services)
12. [Strategies (Planned)](#12-strategies)
13. [Utils](#13-utils)
14. [Validation Schemas](#14-validation-schemas)
15. [Swagger / OpenAPI](#15-swagger--openapi)
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

**Purpose**: Creates and configures the Express application with global middleware in order.

**Middleware registration order**:
1. `express.json()` — Body parsing
2. `tracer` — Request ID assignment + Morgan HTTP logging
3. `injectServices` — Attaches IoC container to request
4. `routes` — All route definitions
5. `errorHandler` — Global error handler (must be last)

---

## 2. Config Layer

### `src/config/environment.js` — Environment Configuration

**Purpose**: Loads `.env.{NODE_ENV}` file via dotenv with `override: true`. In production, validates that critical env vars exist. Exports a typed config object.

| Export | Type | Description |
|---|---|---|
| `env` | `string` | Current NODE_ENV (default: `'development'`) |
| `port` | `number` | HTTP server port (default: `3000`) |
| `database.uri` | `string` | MongoDB connection URI (default: `'mongodb://localhost:27017/myapp_dev'`) |
| `bcrypt.salt` | `number` | Bcrypt salt rounds parsed from `BCRPT_SALT_SIZE` |
| `jwt.secret` | `string` | JWT signing secret |
| `jwt.expiresIn` | `string` | JWT token expiry (default: `'15m'`) |
| `jwt.refreshSecret` | `string` | JWT refresh token secret |
| `jwt.refreshExpiresIn` | `string` | JWT refresh token expiry (default: `'7d'`) |
| `cors.origin` | `string` | Allowed CORS origin (default: `'*'`) |
| `rateLimit.max` | `number\|null` | Max requests per window |

### `src/config/database.js` — MongoDB Connection

**Purpose**: Connects to MongoDB using Mongoose.

| Function | Description |
|---|---|
| `connectDB()` | Calls `mongoose.connect(env.database.uri)`. On success logs `Database connection established successfully.`. On failure logs error and calls `process.exit(1)`. |

### `src/config/security.js` — Security Middleware Configuration

**Purpose**: Configures helmet, express-rate-limit, and CORS options.

| Export | Description |
|---|---|
| `helmetConfig` | Pre-configured `helmet()` middleware |
| `rateLimiter` | `express-rate-limit` instance with 15-minute window, max from env or 100 default |
| `corsOptions` | `{ origin, methods, allowedHeaders }` using SECURITY_DEFAULTS and env config |

---

## 3. Constants

### `src/constants/system.js` — System Constants

#### `SECURITY_DEFAULTS`

| Key | Value | Description |
|---|---|---|
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Rate limit time window |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Default max requests |
| `CORS_METHODS` | `['GET','POST','PUT','DELETE','PATCH']` | Allowed HTTP methods |
| `CORS_ALLOWED_HEADERS` | `['Content-Type','Authorization','X-Request-ID']` | Allowed headers |

#### `HTTP_REQUESTS` — Status Code Lookup Table

A dictionary mapping HTTP status codes to `{ status, message, log }`:

| Code | Status | Message |
|---|---|---|
| 200 | `success` | The request has succeeded. |
| 201 | `success` | Resource created successfully. |
| 204 | `success` | Operation completed successfully. |
| 300 | `redirect` | Multiple choices available. |
| 301 | `redirect` | The resource has been moved permanently. |
| 400 | `fail` | The data provided is invalid or corrupted. |
| 401 | `fail` | Authentication is required to access this resource. |
| 403 | `fail` | You do not have permission to perform this action. |
| 404 | `fail` | The requested resource could not be found. |
| 409 | `fail` | A conflict occurred. The resource might already exist. |
| 500 | `error` | An unexpected internal server error occurred. |
| 503 | `error` | The server is temporarily unavailable. |

---

## 4. Controllers

### `src/controllers/auth.controller.js` — Auth Request Handling

| Function | Method | Path | Description |
|---|---|---|---|---|
| `login(req, res, next)` | POST | `/api/v1/auth/login` | Gets `authService` from `req.getService()`, reads `req.validatedBody`, calls `authService.loginUser()`, returns `201 { success, traceId, data: { user, accessToken, refreshToken } }`. Passes errors to `next(err)`. |
| `register(req, res, next)` | POST | `/api/v1/auth/register` | Gets `authService` from `req.getService()`, reads `req.validatedBody`, calls `authService.registerUser()`, returns `201 { success, traceId, data }`. Passes errors to `next(err)`. |
| `refresh(req, res, next)` | POST | `/api/v1/auth/refresh-token` | Gets `authService` from `req.getService()`, reads `req.validatedBody.refreshToken`, calls `authService.refreshToken()`, returns `200 { success, traceId, data: { accessToken, refreshToken } }`. Passes errors to `next(err)`. |

### `src/controllers/health.controller.js` — Health Check

| Function | Method | Path | Description |
|---|---|---|---|
| `checkHealth(req, res, next)` | GET | `/health` | Reads `NODE_ENV`, `process.uptime()`, `mongoose.connection.readyState`, `process.memoryUsage()`. Returns `200 { success, environment, status, timestamp, uptime, services: { database }, system: { memory } }`. If DB is down, returns `503 { success: false, status: 'DOWN', ... }`. |

---

## 5. Error Hierarchy

```
Error
 └── AppError (base)
      ├── ConflictError       (409)
      ├── NotFoundError       (404)
      ├── ServerError         (500)
      ├── UnauthorizedError   (401)
      └── validationError     (400)
```

### `src/errors/appErrors.js` — Base Error

| Class | Constructor | Description |
|---|---|---|
| `AppError` | `(message, statusCode)` | Looks up default message from `HTTP_REQUESTS[statusCode]`. Sets `statusCode`, `status`, `isOperational = true`. Calls `Error.prepareStackTrace`. |

### Derived Errors

| File | Class | Status | Description |
|---|---|---|---|
| `ConflictError.js` | `ConflictError` | 409 | Resource conflict (e.g., duplicate email) |
| `NotFoundError.js` | `NotFoundError` | 404 | Resource not found |
| `ServerError.js` | `ServerError` | 500 | Internal server error |
| `UnauthorizedError.js` | `UnauthorizedError` | 401 | Authentication required |
| `ValidationError.js` | `validationError` | 400 | Validation failure (note: class name is lowercase `v`) |

**Consistent JSON response shape**:
```json
{
  "success": false,
  "status": "fail",
  "traceId": "abc-123",
  "error": {
    "message": "Resource not found",
    "stack": "(development only)",
    "fields": {}
  }
}
```

---

## 6. Helpers

### `src/helpers/formatJoiErrors.js` — Joi Error Formatter

| Function | Description |
|---|---|
| `formatJoiErrors(joiError)` | Maps `joiError.details[]` to `{ fieldName: [cleanedMessages] }`. Strips quotes from messages. |

**Example output**:
```js
{ email: ['email must be a valid email'], password: ['password length must be at least 8 characters long'] }
```

### `src/helpers/sanitizeData.js` — Data Sanitizer

| Function | Description |
|---|---|
| `sanitizeData(doc, ...fields)` | Converts Mongoose doc to plain object via `toObject()`. Always deletes `__v` and `password`. Optionally deletes additional field names passed as rest args. Returns cleaned object or `null` if doc is falsy. |

Used by `authService.registerUser()` and `authService.loginUser()` to strip sensitive/internal fields before returning user data in API responses.

---

## 7. Middleware Pipeline

### `src/middlewares/errorHandler.js` — Global Error Handler

| Function | Description |
|---|---|
| `errorHandler(err, req, res, next)` | Last middleware. Defaults status to 500. Looks up `HTTP_REQUESTS[statusCode]`. Logs warn for 4xx, error for 5xx (with stack trace). Returns JSON with `success, status, traceId, error: { message, stack (dev only), fields }`. |

### `src/middlewares/injectServices.js` — IoC Injection

| Function | Description |
|---|---|
| `injectServices(req, res, next)` | Attaches `req.container` (the singleton container) and `req.getService(name)` helper that delegates to `container.get(name)`. |

### `src/middlewares/tracer.js` — Request ID & HTTP Logging

| Function | Description |
|---|---|
| `tracerMiddleware(req, res, next)` | Assigns `req.id` from `X-Request-ID` header or first segment of `crypto.randomUUID()`. Sets `X-Request-ID` response header. Creates a Morgan HTTP logger writing to Winston at `http` level with format `[:id] :method :url :status :res[content-length] - :response-time ms`. |

### `src/middlewares/validation.js` — Joi Validation Middleware

| Function | Description |
|---|---|
| `validate(schema)` | Returns Express middleware. Validates `req.body` against Joi schema with `abortEarly: false`. On error: formats via `formatJoiErrors`, creates `ValidationError` with `fields`, passes to `next(error)`. On success: sets `req.validatedBody = value`, calls `next()`. |

### `src/middlewares/auth.js` — JWT Authentication Middleware

| Function | Description |
|---|---|
| `authenticate(req, res, next)` | Extracts Bearer token from `Authorization` header. Verifies it using `verifyJwt()` (standalone export from `security.repository.js`). On success: sets `req.user = { id, email }` from decoded payload, calls `next()`. On failure: passes `UnauthorizedError('Invalid or expired token')` to `next(err)`. Skips middleware entirely if no Authorization header is present. |

### `src/middlewares/rateLimiter.js` — Per-Route Rate Limiter Factory

| Function | Description |
|---|---|
| `createRateLimiter(options)` | Factory that creates Express rate-limit middleware per route. Accepts `{ windowMs, max, message }`. Default: 1-minute window, 10 max, JSON error body. Used to apply different limits per endpoint (e.g., 5/min for login, 10/min for register). |

---

## 8. Models

### `src/models/User.js` — Mongoose User Model

**Schema fields**:

| Field | Type | Description |
|---|---|---|
| `name` | `String` | User's full name |
| `email` | `String` | Email address |
| `password` | `String` | Hashed password |

**Hooks**:
- `pre('save')` — **Commented out** (see `src/models/User.js:13-20`). Hashing is handled by `SecurityService` → `SecurityRepository` instead. When active, hashes password via `bcrypt.hash(this.password, salt)` if `this.isModified('password')`.

**Exports**: `mongoose.model('User', schema)`

### `src/models/index.js` — Auto-Model Loader

| Export | Description |
|---|---|
| Auto-executed `require` side-effect | Scans `src/models/` for `.js` files (excluding `index.js`), calls `require()` on each. Each model's `mongoose.model()` call registers it globally with Mongoose, making it available to all repositories. Imported in `container.js` to ensure models are registered before any repository uses them. |

**How it works**: All schema/model definition files in `src/models/` are automatically discovered and loaded at startup. Developers only need to create a new file with a standard `mongoose.model('Name', schema)` call — the auto-loader handles registration.

---

## 9. Repositories

### `src/repositories/user.repository.js` — User Data Access

| Method | Description |
|---|---|
| `findById(id)` | Delegates to `this.dbStrategy.findById('User', id)` (engine-agnostic) |
| `findByEmail(email)` | Delegates to `this.dbStrategy.findOne('User', { email })` |
| `create(userData)` | Delegates to `this.dbStrategy.create('User', userData)` |
| `hashPassword(pass)` | Empty stub method (unused) |

**Note**: No longer imports Mongoose directly. Receives `{ dbStrategy }` via constructor injection (from container). The strategy is selected by config — `MongoStrategy` (default) or `PostgresStrategy` (stub).

### `src/repositories/security.repository.js` — Security Data Access

| Method | Description |
|---|---|
| `hash(entering)` | Returns `bcrypt.hash(entering, salt)` using env config salt or default 12 |
| `assignJwt(payload, ttl)` | Signs **access** JWT via `jwt.sign(payload, env.jwt.secret, { expiresIn: ttl ?? env.jwt.expiresIn })`. Returns signed token string. |
| `assignRefreshJwt(payload, ttl)` | Signs **refresh** JWT via `jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: ttl ?? env.jwt.refreshExpiresIn })`. Returns signed token string. |
| `comparePassword(providedPassword, hashedPassword)` | Returns `bcrypt.compare(providedPassword, hashedPassword)` for password verification |

**Standalone exports** (not class methods — used directly by `auth` middleware to avoid circular DI):
| Export | Description |
|---|---|
| `verifyJwt(token)` | Verifies access JWT via `jwt.verify(token, env.jwt.secret)`. Returns decoded payload or throws. |
| `verifyRefreshJwt(token)` | Verifies refresh JWT via `jwt.verify(token, env.jwt.refreshSecret)`. Returns decoded payload or throws. |

---

## 10. Routes

### `src/routes/index.js` — Root Router

| Mount | Description |
|---|---|
| `GET /` | Returns `{ message: "SASS work !" }` |
| `/api-docs` | Swagger UI served via `swagger-ui-express` |
| `/health` | Health check routes |
| `/api/v1` | API v1 routes |
| `fallback` | 404 catch-all handler |

### `src/routes/health.js`

| Method | Path | Handler |
|---|---|---|
| `GET` | `/health` | `health.controller.checkHealth` |

### `src/routes/defaults/fallback.js` — 404 Handler

| Handler | Description |
|---|---|
| Fallback middleware | Catches all unmatched routes, passes `NotFoundError('route not found [${req.originalUrl}]')` to next middleware |

### `src/routes/v1/index.js` — v1 Aggregator

| Mount | Description |
|---|---|
| `/auth` | Auth routes |

### `src/routes/v1/auth.js`

| Method | Path | Middleware | Handler |
|---|---|---|---|
| `POST` | `/register` | `registerLimiter, validate(registerSchema)` | `auth.controller.register` |
| `POST` | `/login` | `loginLimiter, validate(loginSchema)` | `auth.controller.login` |
| `POST` | `/refresh-token` | `refreshLimiter, validate(refreshTokenSchema)` | `auth.controller.refresh` |

---

## 11. Services

### `src/services/container.js` — IoC Dependency Container

**`DependencyContainer`** class:

| Method | Description |
|---|---|
| `constructor()` | Initializes `this.services = new Map()` |
| `register(name, instance)` | Stores instance by name via `this.services.set(name, instance)` |
| `get(name)` | Retrieves instance. Throws `Error('Service ${name} not found')` if not registered. |

**Singleton `container`** registers at startup:

| Order | Registration | Dependencies |
|---|---|---|
| 0 | `'dbStrategy'` | `new MongoStrategy()` (or `PostgresStrategy` based on config) |
| 1 | `'storageStrategy'` | `new LocalStorageStrategy(storageConfig)` (or `S3StorageStrategy` based on config) |
| 2 | `'securityService'` | `SecurityService` with `secRepository: SecurityRepository` |
| 3 | `'userRepository'` | `UserRepository` with `{ dbStrategy: container.get('dbStrategy') }` |
| 4 | `'authService'` | `AuthService` with `securityService: container.get('securityService')`, `userRepository: container.get('userRepository')` |

**Note**: Models are auto-loaded at the top of `container.js` via `require('../models/index')` before any repository is instantiated, ensuring Mongoose has all schemas registered.

### `src/services/authService.js` — Auth Business Logic

| Method | Description |
|---|---|
| `constructor({ securityService, userRepository })` | Stores dependencies |
| `registerUser(userData)` | Checks if email exists → throws `ConflictError`. Creates user via repository. Returns user. |
| `loginUser(userData)` | Finds user by email → throws `UnauthorizedError` if not found. Compares password → throws `UnauthorizedError` if invalid. Returns `{ user: sanitizeData(existingUser), accessToken, refreshToken }` on success. |
| `refreshToken(token)` | Verifies refresh JWT via `securityService.verifyRefreshToken(token)`. Finds user by decoded `id` → throws `UnauthorizedError` if not found. Generates and returns `{ accessToken, refreshToken }`. |

### `src/services/securityService.js` — Security Business Logic

| Method | Description |
|---|---|
| `constructor({ secRepository })` | Stores security repository |
| `hashPassword(password)` | Delegates to `this.secRepository.hash(password)`. Returns bcrypt-hashed password. |
| `comparePassword(providedPassword, hashedPassword)` | Delegates to `this.secRepository.comparePassword()`. Returns boolean comparison result. |
| `generateAuthToken(user)` | Builds JWT payload `{ id, email }` from user doc and delegates to `this.secRepository.assignJwt()`. Returns signed access JWT string. |
| `generateRefreshToken(user)` | Builds JWT payload `{ id, email }` from user doc and delegates to `this.secRepository.assignRefreshJwt()`. Returns signed refresh JWT string. |
| `verifyRefreshToken(token)` | Calls `verifyRefreshJwt(token)` (standalone function). Returns decoded payload or throws. |

---

## 12. Strategies

Pluggable backend interfaces under `src/strategies/`. Selected at startup via configuration and registered in the IoC container.

### Database Strategies

| File | Status | Description |
|---|---|---|
| `database/mongo.strategy.js` | **Implemented** | Full MongoDB/Mongoose wrapper. Methods: `create(model, data)`, `findById(model, id)`, `findOne(model, query)`, `find(model, query)`, `update(model, id, data)`, `delete(model, id)`, `count(model, query)`. Each uses `mongoose.model(model)` for engine-agnostic model resolution. |
| `database/postgres.strategy.js` | **Stub** | Same interface as MongoStrategy. Each method throws `new Error('not implemented')`. Ready for PostgreSQL implementation. |

### Storage Strategies

| File | Status | Description |
|---|---|---|
| `storage/localStorage.strategy.js` | **Implemented** | Local filesystem storage using `fs/promises`. Constructor accepts `{ uploadDir, baseUrl }`. Methods: `upload(filename, buffer)` — writes file, returns `{ url, filename }`. `delete(filename)` — removes file. `getUrl(filename)` — returns public URL. Creates `uploadDir` if missing. |
| `storage/s3Storage.strategy.js` | **Stub** | Same interface as LocalStorageStrategy. Each method throws `new Error('not implemented')`. Ready for AWS S3 SDK implementation. |

### Email Strategies (Planned)

| Directory | Purpose |
|---|---|
| `email/` | Empty directory for future email provider abstraction (e.g., SMTP, SendGrid). |

**Pattern**: Each domain defines a consistent interface. The container selects the implementation based on config at startup:
```js
const dbStrategy = config.database.driver === 'postgres'
  ? new PostgresStrategy()
  : new MongoStrategy();
container.register('dbStrategy', dbStrategy);
```

---

## 13. Utils

### `src/utils/logger.js` — Winston Logger

**Log levels**: `error(0)` `warn(1)` `info(2)` `http(3)` `debug(4)`

**Level function**: Returns `'debug'` in development, `'warn'` otherwise.

**Colors**: error=red, warn=yellow, info=green, http=magenta, debug=white

**Format**: `[YYYY-MM-DD HH:mm:ss] env.LEVEL: message {meta}` with stack trace support.

**Transports**:

| Transport | Level | Output |
|---|---|---|
| Console | All (colorized) | stdout |
| File | `error` | `storage/logs/error.log` |
| File | `info` | `storage/logs/app.log` |
| File | `warn` | `storage/logs/warning.log` |

---

## 14. Validation Schemas

### `src/validation/auth/register.js` — Registration Schema (Joi)

| Field | Type | Constraints |
|---|---|---|
| `name` | `string` | trim, min 2, max 30, required |
| `email` | `string` | email format, trim, required |
| `password` | `string` | trim, min 8, required |

### `src/validation/auth/login.js` — Login Schema (Joi)

| Field | Type | Constraints |
|---|---|---|
| `email` | `string` | email format, trim, required |
| `password` | `string` | trim, min 8, required |

### `src/validation/auth/refreshToken.js` — Refresh Token Schema (Joi)

| Field | Type | Constraints |
|---|---|---|
| `refreshToken` | `string` | trim, min 1, required |

---

## 15. Swagger / OpenAPI

### `src/routes/swagger/index.js` — OpenAPI Root Document

- OpenAPI 3.0.0
- Title: "SaaS Framework Custom Engine Architecture"
- Server base path: `/api/v1`
- Paths from `auth.doc.js`
- Components from `components/index.js`

### `src/routes/swagger/components/index.js` — Shared Components

| Section | Contents |
|---|---|
| `securitySchemes` | Bearer JWT auth |
| `responses` | ValidationError, ConflictError, UnauthorizedError, InternalServerError |
| `schemas` | LoginRequest, RegisterRequest (auto-generated from Joi via `joi-to-swagger`), UserResponse, UserEntity, AuthTokenPayload, RefreshTokenRequest |

### `src/routes/swagger/components/responses.js`

| Response | Status | Description |
|---|---|---|---|
| `ValidationError` | 400 | Full error structure with `fields` example |
| `ConflictError` | 409 | Error with stack trace example |
| `UnauthorizedError` | 401 | Auth failure error |
| `InternalServerError` | 500 | Generic error message |

### `src/routes/swagger/schemas/user.entity.js`

| Schema | Properties |
|---|---|
| `UserEntity` | `_id`, `name`, `email`, `createdAt` |
| `AuthTokenPayload` | `accessToken` (JWT string), `refreshToken` (JWT string) |

### `src/routes/swagger/v1/auth.doc.js`

| Endpoint | Method | Request Body | Responses |
|---|---|---|---|---|---|
| `/auth/register` | POST | `RegisterRequest` | 201 (UserResponse), 400 (ValidationError), 409 (ConflictError), 500 (InternalServerError) |
| `/auth/login` | POST | `LoginRequest` | 201 (UserResponse + accessToken + refreshToken), 400 (ValidationError), 401 (UnauthorizedError), 500 (InternalServerError) |
| `/auth/refresh-token` | POST | `RefreshTokenRequest` | 200 (accessToken + refreshToken), 400 (ValidationError), 401 (UnauthorizedError), 500 (InternalServerError) |

---

## 16. Tests

### `src/tests/env.test.js` — Environment Variables

| Test | Assertion |
|---|---|
| NODE_ENV is test | `expect(process.env.NODE_ENV).toBe('test')` |
| MONGO_URI contains sass_test_db | `expect(process.env.MONGO_URI).toContain('sass_test_db')` |
| PORT is 5001 | `expect(process.env.PORT).toBe('5001')` |

### `src/tests/init.test.js` — Sanity Check

| Test | Assertion |
|---|---|
| Framework works | `expect(true).toBe(true)` |
