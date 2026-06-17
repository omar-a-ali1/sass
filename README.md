<p align="center">
  <img src="assets/SASS.svg" alt="SASS Framework Logo" width="120"/>
</p>

<h1 align="center">SASS Framework</h1>

<p align="center">
  <strong>S</strong>calable <strong>A</strong>rchitecture for <strong>S</strong>erver-side <strong>S</strong>ystems
  <br>
  A production-ready Node.js + Express mini-framework with DI container, strategy pattern, JWT auth, auto-discovery, and configurable middleware pipeline.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-22.x-green" alt="Node"/>
  <img src="https://img.shields.io/badge/express-5.x-blue" alt="Express"/>
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License"/>
</p>

---

## Features

- **Dependency Injection** — Map-based IoC container with lifecycle registration
- **Strategy Pattern** — Pluggable backends (MongoStrategy/PostgresStrategy for DB, LocalStorageStrategy/S3StorageStrategy for storage, consoleEmail/stubEmail for email)
- **JWT Auth** — Access + refresh token flow with Bearer middleware, forgot/reset password flow
- **Per-Route Rate Limiting** — Configurable limits per endpoint via factory
- **Auto-Discovery** — Models, routes, and Swagger docs auto-load from directory structure — zero manual wiring
- **Auto-Swagger** — OpenAPI docs generated from route `docs` + auto-detected Joi body schemas + auto-detected query schemas + auto-detected `authenticate` middleware + auto-detected `:id` path params
- **Configurable Middleware Pipeline** — Ordered middleware array in config, injected at bootstrap
- **Configurable Route Prefix** — `ROUTE_PREFIX` env var + matching folder under `routes/`
- **Dynamic Routes** — Path params (`:id`) supported via route file export `path: '/:id'`
- **Query Validation** — `validateQuery(joiSchema)` validates `req.query`, auto-documented in Swagger
- **Typed Errors** — Consistent JSON error responses via error hierarchy
- **Winston Logging** — Structured logging with file transports
- **Docker** — Multi-stage build + Docker Compose (dev, test, prod)

---

## Project Structure

```
├── server.js                          # Entry point
├── src/
│   ├── app.js                         # Express assembly (JSON parsing, CORS, cookie-parser, helmet)
│   ├── bootstrap/
│   │   ├── index.js                   # Bootstrap orchestrator — builds Express app from config
│   │   ├── loadModels.js              # Auto-scans src/models/, registers Mongoose models + converts to OpenAPI schemas
│   │   ├── loadRoutes.js              # Recursively scans routes/{prefix}/, builds Express.Router from file exports
│   │   └── loadSwagger.js            # Generates OpenAPI 3.0 spec from route docs + auto-detected schemas/middleware
│   ├── config/
│   │   ├── environment.js             # Env loading + validation (includes ROUTE_PREFIX)
│   │   ├── database.js                # MongoDB connection
│   │   ├── security.js                # Helmet, CORS, rate-limit config
│   │   └── system.js                  # HTTP codes, security defaults, MIDDLEWARE_PIPELINE, SWAGGER_CONFIG
│   ├── controllers/                   # Request/response handling
│   ├── errors/                        # Error hierarchy (AppError → 4xx/5xx)
│   ├── middlewares/
│   │   ├── auth.js                    # JWT Bearer verification (cookie fallback)
│   │   ├── authorize.js               # Role-based access — authorize('admin') or authorize(['admin', 'moderator'])
│   │   ├── errorHandler.js            # Global error serializer
│   │   ├── injectServices.js          # IoC container injection
│   │   ├── rateLimiter.js             # Per-route rate limiter factory
│   │   ├── tracer.js                  # Request ID + Morgan logging
│   │   └── validation.js              # validate(bodySchema), validateQuery(querySchema)
│   ├── models/
│   │   └── User.js                    # Mongoose schema (role field, timestamps)
│   ├── repositories/                  # Data access layer
│   ├── routes/
│   │   └── api/v1/
│   │       └── auth/                  # login, register, refresh-token, forgot-password, reset-password, me
│   │       └── users/                 # getUser (:id), listUsers (query params)
│   ├── services/
│   │   └── container.js               # DI container + wiring (driver-based strategy selection)
│   ├── swagger/
│   │   └── components/                # Shared security schemes (bearerAuth, cookieAuth), error responses
│   ├── strategies/
│   │   ├── database/
│   │   │   ├── mongo.strategy.js      # Full Mongoose implementation
│   │   │   └── postgres.strategy.js   # Full PG implementation (lazy pg.Pool)
│   │   ├── storage/
│   │   │   ├── localStorage.strategy.js  # Full filesystem implementation
│   │   │   └── s3Storage.strategy.js     # Full S3 implementation (lazy @aws-sdk/client-s3)
│   │   └── email/
│   │       ├── consoleEmail.strategy.js  # Logs to console (dev)
│   │       └── stubEmail.strategy.js     # Throws (placeholder for SMTP)
│   ├── tests/                         # 85 integration + unit tests
│   ├── utils/                         # Joi formatting, data sanitization
│   └── validation/                    # Joi schemas (including users/list.js for query validation)
├── docker-compose.yaml
├── Dockerfile
└── .env.{development,production,test}
```

---

## Architecture Patterns

### Dependency Injection

All dependencies wired in `src/services/container.js`. Controllers retrieve via `req.getService('name')` — never `new`.

```
container.register('dbStrategy', new MongoStrategy())
  → UserRepository receives dbStrategy
    → AuthService receives UserRepository + SecurityService
      → Controller calls req.getService('authService')
```

Driver-based strategy selection in `container.js`:
```js
const dbDriver = container.get('config').database.driver;  // 'mongo' | 'postgres'
const DBStrategy = { mongo: MongoStrategy, postgres: PostgresStrategy }[dbDriver];
container.register('dbStrategy', new DBStrategy());
```

### Strategy Pattern

Backends are swappable by config:

| Domain | Implemented | Also Available |
|---|---|---|
| Database | `MongoStrategy` | `PostgresStrategy` |
| Storage | `LocalStorageStrategy` | `S3StorageStrategy` |
| Email | `ConsoleEmailStrategy` | `StubEmailStrategy` |

### Bootstrap & Auto-Discovery

| Layer | File | Convention |
|---|---|---|
| Models | `bootstrap/loadModels.js` | `mongoose.model('Name', schema)` in `models/` — auto-registers + auto-converts to OpenAPI schemas via `mongoose-to-swagger` |
| Routes | `bootstrap/loadRoutes.js` | Each file exports `{ method, path, middleware, handler }`. Directory path + export `path` form full URL. Path params via `path: '/:id'`. Detects `_validationSchema` (body) and `_queryValidationSchema` (query) on middleware. |
| Swagger | `bootstrap/loadSwagger.js` | Reads route `docs` + auto-detects Joi body/query schemas + auto-detects `authenticate` middleware → adds `security` + auto-detects `:id` params → adds OpenAPI parameters + converts `:param` → `{param}` in path keys |

### Configurable Middleware Pipeline

Defined in `src/config/system.js`:
```js
MIDDLEWARE_PIPELINE: ['express.json', 'tracer', 'injectServices', 'routes', 'errorHandler']
```

`bootstrap/index.js` maps each key to a pre-instantiated middleware and calls `app.use()` in order.

### Request Lifecycle

```
Request → cookieParser → helmet → cors → [pipeline: json → tracer → injectServices → routes]
  ├── rateLimiter (per-route)
  ├── validation / validateQuery (Joi)
  ├── authenticate + authorize (per-route, optional)
  ├── controller → service → repository → strategy
  └── errorHandler (catches all)
```

---

## Quick Start

```bash
# Development
docker compose up app_dev mongodb_dev

# Tests
docker compose up mongodb_test app_test

# Local (requires MongoDB)
npm run dev
```

### API Endpoints

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | — | 10/min | Create account |
| POST | `/api/v1/auth/login` | — | 5/min | Get tokens (access + refresh in JSON + cookie) |
| POST | `/api/v1/auth/refresh-token` | Cookie | 20/min | Refresh tokens |
| POST | `/api/v1/auth/forgot-password` | — | — | Request password reset (email) |
| POST | `/api/v1/auth/reset-password` | — | — | Reset password with reset token |
| GET | `/api/v1/auth/me` | Bearer | — | Current user profile |
| GET | `/api/v1/users/:id` | Bearer | — | Get user by ID (dynamic route demo) |
| GET | `/api/v1/users` | Bearer | — | List users with query params (page, limit, sort, search) |
| GET | `/health` | — | — | System health |
| GET | `/api-docs` | — | — | Swagger UI |

---

## Adding a Feature

1. Create route file: `src/routes/api/v1/{resource}/{action}.js`
2. Export `{ method, path, middleware, handler, docs? }`
3. Add service + repository methods if needed
4. Done — route is live, Swagger auto-generated

### Dynamic routes
```js
// src/routes/api/v1/users/getUser.js
module.exports = {
  method: 'GET',
  path: '/:id',           // :id auto-detected as path param
  middleware: [authenticate],
  handler: async (req, res) => { /* ... */ },
  docs: { summary: 'Get user by ID', tags: ['Users'] }
};
```

### Query validation
```js
// src/validation/users/list.js
const Joi = require('joi');
module.exports = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  sort:   Joi.string().valid('createdAt', '-createdAt').default('-createdAt'),
  search: Joi.string().allow('').optional(),
});

// src/routes/api/v1/users/listUsers.js
const validateQuery = require('../../../middlewares/validation').validateQuery;
module.exports = {
  method: 'GET',
  path: '/',
  middleware: [authenticate, validateQuery(listUsersQuery)],
  handler: async (req, res) => {
    const { page, limit, sort, search } = req.validatedQuery;
    // ...
  }
};
```

---

## Configuration

| Config | File | Env Var | Default |
|---|---|---|---|
| Route prefix | `config/environment.js` | `ROUTE_PREFIX` | `/api/v1` |
| Middleware pipeline | `config/system.js` | — | `['express.json', 'tracer', 'injectServices', 'routes', 'errorHandler']` |
| Swagger metadata | `config/system.js` | — | `{ title: 'SASS API', version: '1.0.0', description: '...' }` |
| Database driver | `config/environment.js` | `DB_DRIVER` | `mongo` |
| Storage driver | `config/environment.js` | `STORAGE_DRIVER` | `local` |
| Email driver | `config/environment.js` | `EMAIL_DRIVER` | `console` |

---

## Testing

```bash
npm test                          # 85 tests, multiple suites
./command/test.sh                 # Docker test runner
```

---

## License

MIT — see [LICENSE](LICENSE)
