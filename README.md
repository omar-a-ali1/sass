<p align="center">
  <img src="assets/SASS.svg" alt="SASS Framework Logo" width="120"/>
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
- **Strategy Pattern** — Pluggable backends (Mongo/Postgres for DB, Local/S3 for storage, Console/Stub for email)
- **JWT Auth** — Access + refresh token flow with Bearer + cookie fallback, role-based `authorize()`, forgot/reset password
- **Auto-Discovery** — Models, routes, and Swagger docs auto-load from directory structure — zero manual wiring
- **Auto-Swagger** — OpenAPI 3.0 generated from route `docs` + auto-detected Joi body/query schemas + auto-detected `authenticate` middleware + `:id` params. Error responses (400, 401, 403, 500) auto-included — routes only declare custom success body and extra codes
- **Swagger UI** — Interactive docs at `/api-docs` (development only)
- **Paginated Queries** — `MongoStrategy.paginate()` and `PostgresStrategy.paginate()` with skip/limit + total count
- **Response Envelope** — `res.respond()`, `res.paginated()`, `res.fail()` — consistent JSON shape with `traceId`
- **File Uploads** — Multer bridge → storage strategy. Factory `upload({ field, maxSize })` returns middleware array
- **API Key Management** — Generate, validate (bcrypt), and revoke API keys with `X-API-Key` authentication middleware
- **Soft Delete** — `softDelete()` / `restore()` methods on both database strategies, `deletedAt` field support across drivers
- **Seeder System** — Auto-discovers `*.seeder.js` in `src/seeders/`, runs via CLI (`npm run seed`). Works with both MongoDB and PostgreSQL
- **CLI Scaffolding** — Laravel-style `npm run make:controller|route|service|repository|validation|model|seeder|all`
- **Route Lister** — `npm run routes` — colour-coded methods, clickable links, middleware chain
- **Model Inspector** — `npm run models` — lists models, tables, and column types per driver
- **DB Query CLI** — `npm run fetch -- <Model>` — query records with `--id`, `--where`, `--limit`, `--sort`, `--raw`
- **Configurable Middleware Pipeline** — Ordered middleware array in config, injected at bootstrap
- **Performance Monitoring** — In-memory metrics at `/health/metrics`
- **Dynamic Routes** — Path params (`:id`) auto-detected in Swagger
- **Per-Route Rate Limiting** — Configurable limits per endpoint via `createRateLimiter()` factory
- **Query Validation** — `validateQuery(joiSchema)` validates `req.query`, auto-documented in Swagger
- **Typed Errors** — Consistent JSON error responses via error hierarchy
- **Winston Logging** — Structured logging with file transports
- **Docker** — Multi-stage build + Docker Compose (dev, test, prod) with PostgreSQL + MongoDB

---

## Project Structure

```
├── server.js                          # Developer entry point — customisable per project
├── cli/
│   ├── make.js                        # Scaffold generator (make:* commands)
│   ├── list-routes.js                 # Route lister (npm run routes)
│   ├── list-models.js                 # Model/table inspector (npm run models)
│   ├── fetch.js                       # DB query CLI (npm run fetch)
│   └── seed.js                        # Seeder CLI (npm run seed) — driver-aware
├── docker-cli/
│   ├── dev.sh                         # Start dev with MongoDB
│   ├── dev-postgres.sh                # Start dev with PostgreSQL
│   ├── test.sh                        # Run tests in Docker
│   ├── models.sh                      # Inspect models from dev container
│   ├── fetch.sh                       # Query DB from dev container
│   └── seed.sh                        # Seed from dev container
├── src/
│   ├── bootstrap/
│   │   ├── index.js                   # Express app assembly from pipeline config
│   │   ├── loadModels.js              # Auto-scans models/ → registers Mongoose models
│   │   ├── loadRoutes.js              # Recursively scans routes/ → builds Router
│   │   ├── loadSwagger.js             # OpenAPI 3.0 generator with auto error refs
│   │   ├── loadContainer.js           # IoC container with multi-pass DI
│   │   └── loadSeeders.js             # Driver-aware seeder runner (Mongoose + Postgres)
│   ├── config/
│   │   ├── environment.js             # Env loading + validation (.env.{NODE_ENV})
│   │   ├── database.js                # Connection (Mongoose or PG verify)
│   │   ├── security.js                # Helmet, CORS, rate-limit config
│   │   └── system.js                  # Pipeline, HTTP codes, Swagger config
│   ├── controllers/                   # Request/response handling
│   ├── errors/                        # AppError → 4xx/5xx typed errors
│   ├── middlewares/
│   │   ├── auth.js                    # JWT Bearer verification (cookie fallback)
│   │   ├── authorize.js               # Role-based access
│   │   ├── errorHandler.js            # Global error serializer
│   │   ├── injectServices.js          # IoC container → req.getService()
│   │   ├── perfMonitor.js             # Response time, metrics collection
│   │   ├── rateLimiter.js             # Per-route factory
│   │   ├── responder.js               # res.respond(), paginated(), fail()
│   │   ├── tracer.js                  # Request ID + Morgan logging
│   │   ├── upload.js                  # Multer → storage strategy bridge
│   │   └── validation.js              # validate(body), validateQuery(query)
│   ├── models/
│   │   ├── User.js                    # Mongoose schema (name, email, password, role)
│   │   ├── Store.js                   # Mongoose schema (name)
│   │   └── ActivityLog.js            # Mongoose schema (audit logging)
│   ├── repositories/                  # Data access layer (user, activityLog, security)
│   ├── routes/
│   │   ├── index.js                   # GET / — dev dashboard / production status
│   │   ├── health/
│   │   │   ├── index.js               # GET /health — system health + DB status
│   │   │   └── metrics.js             # GET /health/metrics — perf snapshot
│   │   └── api/v1/
│   │       ├── auth/                  # login, register, refresh-token, forgot/reset, me
│   │       └── users/                 # getUser (:id), listUsers (query + pagination)
│   ├── seeders/
│   │   └── user.seeder.js             # Seeds 10 users via faker
│   ├── services/
│   │   ├── authService.js             # Auth business logic
│   │   ├── userService.js             # User CRUD + search
│   │   └── securityService.js         # JWT signing + bcrypt delegation
│   ├── swagger/components/            # Security schemes, shared responses, schemas
│   ├── strategies/
│   │   ├── database/
│   │   │   ├── mongo.strategy.js      # Mongoose (find, create, paginate, truncate...)
│   │   │   └── postgres.strategy.js   # pg.Pool (same interface + truncate, insertMany)
│   │   ├── storage/
│   │   │   ├── localStorage.strategy.js   # Filesystem
│   │   │   └── s3Storage.strategy.js      # S3 via @aws-sdk/client-s3
│   │   └── email/
│   │       ├── consoleEmail.strategy.js   # Logs to console
│   │       └── stubEmail.strategy.js      # Placeholder for SMTP
│   ├── tests/                         # 117 tests across 12 suites
│   ├── utils/                         # Logger, Joi formatting, sanitize
│   └── validation/                    # Joi schemas (auth/, users/list.js)
├── docs/                              # Full documentation suite
├── docker-compose.yaml                # Multi-service Compose (app + DBs)
├── Dockerfile                         # Multi-stage build
└── .env.{development,test,production}
```

---

## CLI Reference

### Scaffolding

```bash
npm run make:controller -- Product    # src/controllers/product.controller.js
npm run make:route -- Product         # 5 CRUD route files
npm run make:service -- Product       # src/services/productService.js
npm run make:repository -- Product    # src/repositories/product.repository.js
npm run make:validation -- Product    # Joi schemas (create, update, list)
npm run make:model -- Product         # Mongoose model
npm run make:seeder -- Product        # Faker seeder definition
npm run make:all -- Product           # Everything above (except routes)
```

### Database

```bash
# Seed
npm run seed                          # Seed all (driver-aware: works with Mongo + Postgres)
npm run seed -- --clean               # Drop + reseed
npm run seed -- --only user           # Seed only a specific seeder

# Inspect models and columns
npm run models                        # Lists tables + column types per driver

# Query records
npm run fetch -- User                 # All users (table format)
npm run fetch -- User --id 1          # By ID
npm run fetch -- User --limit 5       # Limit results
npm run fetch -- User --where '{"role":"admin"}'  # Filter
npm run fetch -- User --sort -createdAt --raw      # Desc sorted, raw JSON
```

### Routing & Dev

```bash
npm run routes                        # Colour-coded route list with middleware chain
npm run dev                           # Dev server with hot-reload (node --watch)
npm start                             # Production server
npm test                              # 100 tests, 9 suites
```

---

## Docker CLI

Predefined scripts in [`docker-cli/`](./docker-cli) with health-check dependency management:

```bash
bash docker-cli/dev.sh                # Dev with MongoDB
bash docker-cli/dev-postgres.sh       # Dev with PostgreSQL
bash docker-cli/test.sh               # Run tests
bash docker-cli/seed.sh               # Seed database
bash docker-cli/models.sh             # Inspect models
bash docker-cli/fetch.sh User --limit 5  # Query records
```

---

## Swagger Response Abstraction

Routes no longer need to declare common error responses — the framework adds them automatically:

| Code | Added when |
|---|---|
| `400` | **Every route** |
| `500` | **Every route** |
| `401`, `403` | Routes with `authenticate` middleware |

Route files only declare what's unique: custom success body content and extra codes like `404`, `409`, `503`.

```js
// Before — route declared all error refs manually
responses: {
  201: { ...custom body... },
  400: { $ref: '#/components/responses/ValidationError' },
  500: { $ref: '#/components/responses/InternalServerError' },
}

// After — only custom success + non-default codes
responses: {
  200: { ...custom body... },
  404: { $ref: '#/components/responses/NotFoundError' },
  // 400 and 500 auto-added by the framework
}
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
| GET | `/api/v1/users` | — | — | List users (page, limit, sort, search) |
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

### Strategy Pattern

| Domain | Active | Alternate |
|---|---|---|
| Database | `MongoStrategy` | `PostgresStrategy` |
| Storage | `LocalStorageStrategy` | `S3StorageStrategy` |
| Email | `ConsoleEmailStrategy` | `StubEmailStrategy` |

Switch drivers by changing `DB_DRIVER`, `STORAGE_DRIVER`, or `EMAIL_DRIVER` in `.env`.

### Middleware Pipeline

```
favicon → helmet → cors → cookieParser → json(limit) → urlencoded
  → rateLimiter → perfMonitor → tracer → injectServices → responder
    → routes → fallback → errorHandler
```

Order defined in `MIDDLEWARE_PIPELINE` in `src/config/system.js`.

### Request Lifecycle

```
Request → pipeline → routes → [auth/validation/rate-limit] → controller
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
bash docker-cli/dev.sh                # Start dev with MongoDB
bash docker-cli/dev-postgres.sh       # Start dev with PostgreSQL
bash docker-cli/seed.sh               # Seed database
bash docker-cli/test.sh               # Run tests
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `BODY_LIMIT` | `1mb` | Max request body |
| `DB_DRIVER` | `mongo` | `mongo` or `postgres` |
| `POSTGRES_URI` | — | PostgreSQL connection string |
| `MONGO_URI` | `mongodb://localhost:27017/myapp_dev` | MongoDB URI |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `CORS_ORIGIN` | `*` | Allowed origins |
| `RATE_LIMIT_MAX` | `100` | Requests per 15min window |

---

## Testing

```bash
npm test                          # 117 tests, 12 suites, ~8s
```

| Suite | Tests | Coverage |
|---|---|---|
| `auth.int.test.js` | 25 | Full auth flow |
| `auth.middleware.test.js` | 10 | Authenticate + authorize |
| `dynamic-routes.test.js` | 7 | Path params, query validation |
| `strategies.test.js` | 20 | Mongo, Postgres, LocalStorage, S3 |
| `apiKey.test.js` | 12 | API key generation, validation, revocation |
| `softDelete.strategy.test.js` | 4 | Soft delete on Mongo + Postgres strategies |
| `email.strategy.test.js` | 3 | Console, SMTP fallback, and stub email |
| `rateLimiter.test.js` | 8 | Rate limiter factory |
| `security.repository.test.js` | 10 | JWT + bcrypt |
| `env.test.js` | 3 | Env loading |
| `init.test.js` | 3 | Bootstrap |
| Static analysis | 14 | Lint-style checks |

---

## License

MIT — see [LICENSE](LICENSE)
