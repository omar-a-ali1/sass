<p align="center">
  <img src="./src/lib/assets/SASS.svg" alt="SASS Framework Logo" width="120"/>
</p>

<h1 align="center">SASS Framework</h1>

<p align="center">
  <em>From the Arabic <b>اَلسَّاس</b> (al-sās) — "the foundation"</em>
  <br><br>
  <strong>S</strong>calable <strong>A</strong>rchitecture for <strong>S</strong>erver-side <strong>S</strong>ystems
  <br>
  A production-ready Node.js + Express mini-framework with DI container, strategy pattern, JWT auth, auto-discovery, CLI scaffolding, seeder system, and Swagger abstraction.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-22.x-green" alt="Node"/>
  <img src="https://img.shields.io/badge/express-5.x-blue" alt="Express"/>
  <img src="https://img.shields.io/badge/tests-117_passing-brightgreen" alt="Tests"/>
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License"/>
</p>

---

## Features

- **Dependency Injection** — Map-based IoC container with lifecycle registration, auto-discovered repos + services
- **Strategy Pattern** — Pluggable backends (Mongo/Postgres for DB, Local/S3 for storage, Console/SMTP/Stub for email)
- **Database Transactions** — `withTransaction()` on both strategies with unified `trx` proxy API; row-level locking (`forUpdate`/`forFind`) on Postgres
- **Cross-Model Joins** — `db.join()` with pagination, works on both Mongo (`$lookup`) and Postgres (`LEFT JOIN`)
- **JWT Auth** — Access + refresh token flow with Bearer + cookie fallback, role-based `authorize()`, forgot/reset password
- **Auto-Discovery** — Models, routes, and Swagger docs auto-load from directory structure — zero manual wiring
- **Auto-Swagger** — OpenAPI 3.0 generated from route `docs` + auto-detected Joi schemas + `authenticate` middleware + `:id` params. Error responses (400, 401, 403, 500) auto-included
- **Swagger UI** — Interactive docs at `/api-docs` (development only)
- **API Key Management** — Generate, validate (bcrypt), and revoke API keys with `X-API-Key` authentication middleware
- **Paginated Queries** — `paginate()` with skip/limit + total count, unified across both DB strategies
- **Soft Delete** — `softDelete()` / `restore()` on both database strategies, `deletedAt` field support
- **Response Envelope** — `res.respond()`, `res.paginated()`, `res.fail()` — consistent JSON shape with `traceId`
- **CSRF Protection** — Double-submit cookie pattern, auto-enabled when `PROJECT_TYPE=cookies` or `both`
- **Response Caching** — Pluggable cache strategies (`memory`, `file`, `redis` stub) with per-route middleware
- **Auto-Sync Watcher** — `npm run cb-sync` watches `src/models/` and syncs Postgres schema automatically
- **File Uploads** — Multer bridge → storage strategy. Factory `upload({ field, maxSize })` returns middleware array
- **Seeder System** — Auto-discovers `*.seeder.js` in `src/seeders/`, driver-aware (Mongo + Postgres), `--clean` flag
- **CLI Scaffolding** — Laravel-style `npm run make:*` commands (controller, route, service, repository, validation, model, seeder, all)
- **Route Lister** — `npm run routes` — colour-coded methods, clickable links, middleware chain
- **Model Inspector** — `npm run models` — lists models, tables, and column types per driver
- **DB Query CLI** — `npm run fetch -- <Model>` — query records with `--id`, `--where`, `--limit`, `--sort`, `--raw`
- **DB Sync Tool** — `npm run sync` — auto-syncs Postgres schema from Mongoose models (additive only)
- **Performance Monitoring** — In-memory metrics at `/health/metrics`
- **Configurable Middleware Pipeline** — Ordered array in config, injected at bootstrap
- **Dynamic Routes** — Path params (`:id`) auto-detected in Swagger
- **Per-Route Rate Limiting** — Declarative `rateLimit` property on route definitions
- **Query Validation** — `validateQuery(joiSchema)` validates `req.query`, auto-documented in Swagger
- **Typed Errors** — `AppError` hierarchy (Conflict, NotFound, Unauthorized, Forbidden, Validation, Server)
- **Winston Logging** — Structured logging with console + file transports
- **Activity Logging** — Auto-log every request via `activityLog` middleware
- **Docker** — Multi-stage build + Docker Compose (dev, test, prod) with PostgreSQL + MongoDB

---

## Project Structure

```
├── server.js                          # Entry point
├── src/
│   ├── app.js                         # Express app export
│   ├── bootstrap/
│   │   ├── index.js                   # Express app assembly
│   │   ├── container.js               # DependencyContainer class
│   │   ├── loadModels.js              # Auto-scans models/
│   │   ├── loadStrategies.js          # Registers all strategies (DB, storage, email, cache)
│   │   ├── loadContainer.js           # IoC wiring: loadStrategies + auto-discover repos/services
│   │   ├── loadRoutes.js              # Recursively scans routes/ → Router
│   │   ├── loadSwagger.js             # OpenAPI 3.0 generator
│   │   └── loadSeeders.js             # Driver-aware seeder runner
│   ├── config/
│   │   ├── environment.js             # Env loading (.env.{NODE_ENV})
│   │   ├── database.js                # MongoDB / Postgres connection
│   │   ├── security.js                # Helmet, CORS, rate-limit config
│   │   └── system.js                  # Pipeline, HTTP codes, Swagger config
│   ├── controllers/                   # Request/response handling
│   │   ├── auth.controller.js
│   │   ├── health.controller.js
│   │   ├── user.controller.js
│   │   └── apiKey.controller.js
│   ├── lib/
│   │   ├── assets/                    # Logo, favicon, SASS.svg
│   │   ├── errors/                    # AppError + typed subclasses (7 files)
│   │   ├── strategies/
│   │   │   ├── database/
│   │   │   │   ├── mongo.strategy.js      # Mongoose — CRUD, join, withTransaction
│   │   │   │   └── postgres.strategy.js   # pg.Pool — same + forUpdate/forFind
│   │   │   ├── email/
│   │   │   │   ├── consoleEmail.strategy.js
│   │   │   │   ├── smtpEmail.strategy.js
│   │   │   │   └── stubEmail.strategy.js
│   │   │   ├── storage/
│   │   │   │   ├── localStorage.strategy.js
│   │   │   │   └── s3Storage.strategy.js
│   │   │   └── cache/
│   │   │       ├── memoryCache.strategy.js  # In-memory with TTL
│   │   │       ├── fileCache.strategy.js    # JSON files
│   │   │       └── redisCache.strategy.js   # Stub (requires ioredis)
│   │   ├── swagger/
│   │   │   └── components/
│   │   │       ├── index.js            # Security schemes, shared responses, schemas
│   │   │       └── responses.js        # Auto-generated response docs
│   │   └── utils/
│   │       ├── logger.js               # Winston
│   │       ├── sanitizeData.js         # Strip password/__v
│   │       └── formatJoiErrors.js      # Joi → field map
│   ├── middlewares/                    # 14 files
│   │   ├── auth.js                     # JWT Bearer + cookie fallback
│   │   ├── authorize.js                # Role-based access
│   │   ├── authorizeApiKey.js          # API key permission check
│   │   ├── apiKeyAuth.js               # X-API-Key header validation
│   │   ├── validation.js               # validate(body), validateQuery(query)
│   │   ├── upload.js                   # Multer → storage strategy
│   │   ├── errorHandler.js             # Global error serializer
│   │   ├── injectServices.js           # IoC → req.getService()
│   │   ├── responder.js                # res.respond / paginated / fail
│   │   ├── rateLimiter.js              # Per-route factory
│   │   ├── tracer.js                   # Request ID + Morgan logging
│   │   ├── perfMonitor.js              # Response time metrics
│   │   ├── activityLog.js              # Auto-log every request
│   │   └── fallback.js                 # 404 catch-all
│   ├── models/
│   │   ├── User.js
│   │   ├── ApiKey.js
│   │   └── ActivityLog.js
│   ├── repositories/                   # Data access layer
│   │   ├── user.repository.js
│   │   ├── apiKey.repository.js
│   │   ├── security.repository.js
│   │   └── activityLog.repository.js
│   ├── routes/
│   │   ├── index.js                    # GET /
│   │   ├── health/
│   │   │   ├── index.js                # GET /health
│   │   │   └── metrics.js              # GET /health/metrics
│   │   └── api/v1/
│   │       ├── auth/                   # login, register, refresh-token, forgot/reset, me
│   │       ├── users/                  # GET /, GET /:id
│   │       └── api-keys/               # POST /, GET /, DELETE /:id
│   ├── seeders/
│   │   └── user.seeder.js
│   ├── services/                       # Business logic
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── apiKeyService.js
│   │   ├── securityService.js
│   │   └── activityLogService.js
│   ├── tests/                          # 117 tests, 12 suites
│   ├── tools/
│   │   ├── cli/
│   │   │   ├── make.js                 # Scaffold generator
│   │   │   ├── list-routes.js          # Route lister
│   │   │   ├── list-models.js          # Model/table inspector
│   │   │   ├── fetch.js                # DB query CLI
│   │   │   ├── seed.js                 # Seeder runner
│   │   │   └── sync-db.js              # Postgres schema sync
│   │   └── docker-cli/                 # 7 shell scripts
│   │       ├── dev.sh                  # Dev with MongoDB
│   │       ├── dev-postgres.sh         # Dev with PostgreSQL
│   │       ├── test.sh                 # Run tests
│   │       ├── seed.sh                 # Seed database
│   │       ├── models.sh               # Inspect models
│   │       ├── fetch.sh                # Query records
│   │       └── sync.sh                 # Sync Postgres schema
│   └── validation/
│       ├── auth/                       # login, register, refresh, forgot, reset
│       ├── users/
│       │   └── list.js                 # page, limit, sort, search
│       └── api-keys/
│           └── create.js               # name, permissions
├── docs/                               # 12 documentation files
├── server.js                           # HTTP server + Socket.IO
├── docker-compose.yaml                 # Multi-service Compose
├── Dockerfile                          # Multi-stage build
├── jest.config.js
├── jest.setup.js
├── package.json
├── AI_CONTEXT.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── VIBE_CODING.md
├── .env.example
├── .env.development
└── .env.test
```

---

## CLI Reference

```bash
# Scaffolding
npm run make:controller -- Product
npm run make:route -- Product         # 5 CRUD route files
npm run make:service -- Product
npm run make:repository -- Product
npm run make:validation -- Product    # create, update, list schemas
npm run make:model -- Product
npm run make:seeder -- Product
npm run make:all -- Product           # Everything except routes

# Database
npm run seed                          # Seed all (driver-aware)
npm run seed -- --clean               # Drop + reseed
npm run seed -- --only user           # Seed only one
npm run models                        # List tables + column types
npm run fetch -- User                 # Query records
npm run fetch -- User --id 1          # By ID

# Schema sync (Postgres)
npm run sync                          # Sync all models to Postgres
npm run sync User Store               # Sync specific models
npm run cb-sync                       # Auto-sync on model changes (run with dev)

# Routing & Dev
npm run routes                        # Colour-coded route list
npm run dev                           # Dev server (node --watch)
npm start                             # Production server
npm test                              # 117 tests, 12 suites
```

---

## Docker CLI

```bash
bash src/tools/docker-cli/dev.sh              # Dev with MongoDB
bash src/tools/docker-cli/dev-postgres.sh     # Dev with PostgreSQL
bash src/tools/docker-cli/test.sh             # Run tests
bash src/tools/docker-cli/seed.sh             # Seed database
bash src/tools/docker-cli/models.sh           # Inspect models
bash src/tools/docker-cli/fetch.sh User --limit 5
bash src/tools/docker-cli/sync.sh             # Sync Postgres schema
```

---

## Database Features

### Cross-Model Joins

Query related data across tables/collections — works on both strategies:

```js
const result = await db.join('Order', [
  { with: 'User', local: 'userId', foreign: '_id', as: 'user' },
  { with: 'Product', local: 'productId', foreign: '_id', as: 'product' },
], { status: 'active' }, { page: 1, limit: 20, sort: '-createdAt' });
```

- **Mongo** — uses `$lookup` aggregation; joined data as arrays under `as` key
- **Postgres** — uses `LEFT JOIN` SQL; columns flat in the row

### Database Transactions

Atomic multi-step operations on both databases:

```js
await db.withTransaction(async (trx) => {
  const account = await trx.forUpdate('Account', accountId);
  await trx.findByIdAndUpdate('Account', accountId, { balance: account.balance - 100 });
  await trx.create('Transaction', { from: accountId, amount: 100 });
});
```

All methods on the `trx` proxy participate in the transaction. On throw → full rollback.

### Row-Level Locking (Postgres)

```js
await db.withTransaction(async (trx) => {
  const account = await trx.forUpdate('Account', accountId);        // single row
  const pending = await trx.forFind('Transaction', { status: 'pending' }); // multiple
});
```

---

## API Endpoints

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | — | 10/min | Create account |
| POST | `/api/v1/auth/login` | — | 5/min | Get tokens |
| POST | `/api/v1/auth/refresh-token` | Cookie | 20/min | Refresh tokens |
| POST | `/api/v1/auth/forgot-password` | — | 5/min | Request password reset |
| POST | `/api/v1/auth/reset-password` | — | 10/min | Reset password with token |
| GET | `/api/v1/auth/me` | Bearer | — | Current user profile |
| GET | `/api/v1/users/:id` | Bearer | — | Get user by ID |
| GET | `/api/v1/users` | — | — | List users (paginated, search) |
| POST | `/api/v1/api-keys` | Bearer | — | Create API key |
| GET | `/api/v1/api-keys` | Bearer | — | List API keys |
| DELETE | `/api/v1/api-keys/:id` | Bearer | — | Revoke API key |
| GET | `/health` | — | — | System health + DB status |
| GET | `/health/metrics` | — | — | Performance metrics |
| GET | `/api-docs` | — | — | Swagger UI (dev only) |

---

## Architecture Patterns

### Dependency Injection

```
container.register('dbStrategy', new MongoStrategy())
  → UserRepository receives dbStrategy
    → UserService receives UserRepository
      → Controller calls req.getService('userService')
```

Auto-discovery scans `src/repositories/*.repository.js` and `src/services/*Service.js` — no manual registration needed.

### Strategy Pattern

| Domain | Active | Alternate | Also Available |
|---|---|---|---|
| Database | `MongoStrategy` | `PostgresStrategy` | `smtp` — real SMTP |
| Storage | `LocalStorageStrategy` | `S3StorageStrategy` | |
| Email | `ConsoleEmailStrategy` | `StubEmailStrategy` | |

Switch drivers by changing `DB_DRIVER`, `STORAGE_DRIVER`, or `EMAIL_DRIVER` in `.env`.

### Middleware Pipeline

```
favicon → helmet → cors → cookieParser → json(limit) → urlencoded
  → csrf → rateLimiter → perfMonitor → tracer → injectServices → responder
    → activityLog → routes → fallback → errorHandler
```

Order defined in `MIDDLEWARE_PIPELINE` in `src/config/system.js`. Route-level rate limiting is prepended automatically via the `rateLimit` property.

### Request Lifecycle

```
Request → pipeline → routes → [auth/validate/rate-limit] → controller
  → service → repository → dbStrategy → response
    → errorHandler catches all typed errors → structured JSON
```

---

## Quick Start

```bash
# Local (requires MongoDB or PostgreSQL)
cp .env.development.example .env.development
npm install
npm run dev
```

```bash
# Docker
bash src/tools/docker-cli/dev.sh              # Start dev with MongoDB
bash src/tools/docker-cli/dev-postgres.sh     # Start dev with PostgreSQL
bash src/tools/docker-cli/seed.sh             # Seed database
bash src/tools/docker-cli/test.sh             # Run tests
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `BODY_LIMIT` | `1mb` | Max request body |
| `PROJECT_TYPE` | `jwt` | `jwt`, `cookies`, or `both` |
| `DB_DRIVER` | `mongo` | `mongo` or `postgres` |
| `MONGO_URI` | `mongodb://localhost:27017/myapp_dev` | MongoDB URI |
| `POSTGRES_URI` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `CORS_ORIGIN` | `*` | Allowed origins |
| `RATE_LIMIT_MAX` | `100` | Requests per 15min window |
| `STORAGE_DRIVER` | `local` | `local` or `s3` |
| `EMAIL_DRIVER` | `console` | `console`, `smtp`, or `stub` |
| `CACHE_DRIVER` | `memory` | `memory`, `file`, or `redis` |
| `CACHE_TTL` | `300` | Default cache TTL in seconds |

---

## Testing

```bash
npm test                          # 117 tests, 12 suites, ~10s
```

| Suite | Tests | Coverage |
|---|---|---|
| `auth.int.test.js` | 25 | Full auth flow (register, login, refresh, forgot, reset, me) |
| `auth.middleware.test.js` | 10 | Authenticate + authorize middleware |
| `strategies.test.js` | 20 | Mongo, Postgres, LocalStorage, S3Storage |
| `apiKey.test.js` | 12 | API key generation, validation, revocation, expiry |
| `dynamic-routes.test.js` | 7 | Path params, query validation |
| `security.repository.test.js` | 10 | JWT sign/verify, bcrypt |
| `rateLimiter.test.js` | 8 | Rate limiter factory |
| `softDelete.strategy.test.js` | 4 | Soft delete on Mongo + Postgres |
| `email.strategy.test.js` | 3 | Console, SMTP, stub email |
| `activityLog.test.js` | 3 | Activity log service |
| `env.test.js` | 3 | Environment loading |
| `init.test.js` | 3 | Bootstrap initialization |
| Static analysis | 14 | Lint-style checks |

---

## License

MIT — see [LICENSE](LICENSE)