<p align="center">
  <img src="assets/SASS.svg" alt="SASS Framework Logo" width="120"/>
</p>

<h1 align="center">SASS Framework</h1>

<p align="center">
  <em>From the Arabic <b>اَلسَّاس</b> (al-sās) — "the foundation"</em>
  <br><br>
  <strong>S</strong>calable <strong>A</strong>rchitecture for <strong>S</strong>erver-side <strong>S</strong>ystems
  <br>
  A production-ready Node.js + Express mini-framework with DI container, strategy pattern, JWT auth, auto-discovery, CLI scaffolding, and seeder system.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-22.x-green" alt="Node"/>
  <img src="https://img.shields.io/badge/express-5.x-blue" alt="Express"/>
  <img src="https://img.shields.io/badge/tests-85_passing-brightgreen" alt="Tests"/>
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License"/>
</p>

---

## Features

- **Dependency Injection** — Map-based IoC container with lifecycle registration
- **Strategy Pattern** — Pluggable backends (Mongo/Postgres for DB, Local/S3 for storage, Console/Stub for email)
- **JWT Auth** — Access + refresh token flow with Bearer + cookie fallback, role-based `authorize()`, forgot/reset password
- **Auto-Discovery** — Models, routes, and Swagger docs auto-load from directory structure — zero manual wiring
- **Auto-Swagger** — OpenAPI 3.0 generated from route `docs` + auto-detected Joi body/query schemas + auto-detected `authenticate` middleware + auto-detected `:id` path params
- **Swagger UI** — Interactive docs at `/api-docs` (development only — zero prod dependencies)
- **Paginated Queries** — `MongoStrategy.paginate()` and `PostgresStrategy.paginate()` with skip/limit + total count
- **Response Envelope** — `res.respond()`, `res.paginated()`, `res.fail()` — consistent JSON shape with `traceId`
- **File Uploads** — Multer bridge → storage strategy. Factory `upload({ field, maxSize })` returns middleware array
- **Seeder System** — Auto-discovers `*.seeder.js` in `src/seeders/`, runs via CLI (`npm run seed`)
- **CLI Scaffolding** — Laravel-style `npm run make:controller|route|service|repository|validation|model|seeder|all`
- **Route Lister** — `npm run routes` — colour-coded methods, clickable links, middleware chain
- **Configurable Middleware Pipeline** — Ordered middleware array in config, injected at bootstrap
- **Configurable Route Prefix** — `ROUTE_PREFIX` env var + matching folder under `routes/`
- **Performance Monitoring** — In-memory metrics at `/health/metrics`
- **Dynamic Routes** — Path params (`:id`) auto-detected in Swagger
- **Per-Route Rate Limiting** — Configurable limits per endpoint via `createRateLimiter()` factory
- **Query Validation** — `validateQuery(joiSchema)` validates `req.query`, auto-documented in Swagger
- **Typed Errors** — Consistent JSON error responses via error hierarchy
- **Winston Logging** — Structured logging with file transports
- **Docker** — Multi-stage build + Docker Compose (dev, test, prod)

---

## Project Structure

```
├── server.js                          # Entry point — DB connect, server start
├── cli/
│   ├── make.js                        # Scaffold generator (make:* commands)
│   ├── list-routes.js                 # Route lister (npm run routes)
│   └── seed.js                        # Seeder CLI (npm run seed)
├── src/
│   ├── app.js                         # Thin re-export of bootstrap/index.js
│   ├── bootstrap/
│   │   ├── index.js                   # Orchestrator — builds Express app from pipeline config
│   │   ├── loadModels.js              # Auto-scans src/models/ → registers Mongoose models
│   │   ├── loadRoutes.js              # Recursively scans routes/ → builds Express.Router
│   │   ├── loadSwagger.js             # Generates OpenAPI 3.0 spec from routes
│   │   └── loadSeeders.js             # Discovers + runs src/seeders/*.seeder.js
│   ├── config/
│   │   ├── environment.js             # Env loading + validation
│   │   ├── database.js                # MongoDB connection (throws, not process.exit)
│   │   ├── security.js                # Helmet, CORS, rate-limit config
│   │   └── system.js                  # MIDDLEWARE_PIPELINE, HTTP codes, Swagger config
│   ├── controllers/                   # Request/response handling
│   ├── errors/                        # AppError → 4xx/5xx typed errors
│   ├── middlewares/
│   │   ├── auth.js                    # JWT Bearer verification (cookie fallback)
│   │   ├── authorize.js               # Role-based access (attaches _label + _roles)
│   │   ├── errorHandler.js            # Global error serializer
│   │   ├── injectServices.js          # IoC container → req.getService()
│   │   ├── perfMonitor.js             # Response time, metrics collection
│   │   ├── rateLimiter.js             # Per-route factory (attaches _label)
│   │   ├── responder.js               # res.respond() / res.paginated() / res.fail()
│   │   ├── tracer.js                  # Request ID + Morgan logging
│   │   ├── upload.js                  # Multer → storage strategy bridge
│   │   └── validation.js              # validate(body), validateQuery(query)
│   ├── models/
│   │   ├── User.js                    # Mongoose schema (name, email, password, role)
│   │   └── Store.js                   # Mongoose schema (name)
│   ├── repositories/
│   ├── routes/
│   │   ├── health.js                  # /health + /health/metrics
│   │   ├── defaults/fallback.js       # 404 catch-all
│   │   └── api/v1/
│   │       ├── auth/                  # login, register, refresh-token, forgot/reset password, me
│   │       └── users/                 # getUser (:id), listUsers (query + pagination)
│   ├── seeders/
│   │   └── user.seeder.js             # Seeds 10 users via faker
│   ├── services/
│   │   └── container.js               # DI wiring (driver-based strategy selection)
│   ├── swagger/components/            # Security schemes, shared error responses, Joi schemas → OpenAPI
│   ├── strategies/
│   │   ├── database/
│   │   │   ├── mongo.strategy.js      # Full Mongoose (find, findOne, findById, paginate, create...)
│   │   │   └── postgres.strategy.js   # Full PG via lazy pg.Pool (same interface + paginate)
│   │   ├── storage/
│   │   │   ├── localStorage.strategy.js   # Filesystem (upload, download, delete, getUrl)
│   │   │   └── s3Storage.strategy.js      # S3 via lazy @aws-sdk/client-s3
│   │   └── email/
│   │       ├── consoleEmail.strategy.js   # Logs to console
│   │       └── stubEmail.strategy.js      # Throws (placeholder for SMTP)
│   ├── tests/                         # 85 integration + unit tests (8 suites)
│   ├── utils/                         # Logger, Joi formatting, sanitize
│   └── validation/                    # Joi schemas (auth/, users/list.js, etc.)
├── docs/                              # Usage guide, API reference, architecture, advancement
├── docker-compose.yaml
├── Dockerfile
└── .env.{development,test}
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

Driver-based strategy selection:
```js
const DBStrategy = { mongo: MongoStrategy, postgres: PostgresStrategy }[config.database.driver];
container.register('dbStrategy', new DBStrategy());
```

### Strategy Pattern

| Domain | Implemented | Also Available |
|---|---|---|
| Database | `MongoStrategy` (+ `paginate`) | `PostgresStrategy` (+ `paginate`) |
| Storage | `LocalStorageStrategy` | `S3StorageStrategy` |
| Email | `ConsoleEmailStrategy` | `StubEmailStrategy` |

### Bootstrap & Auto-Discovery

| Layer | File | Convention |
|---|---|---|
| Models | `bootstrap/loadModels.js` | `mongoose.model('Name', schema)` in `models/` — auto-registers |
| Routes | `bootstrap/loadRoutes.js` | Each file exports `{ method, path, middleware, handler }` — directory path + export `path` form full URL |
| Swagger | `bootstrap/loadSwagger.js` | Reads route `docs` + auto-detects Joi schemas, `authenticate`, `:id` params |
| Seeders | `bootstrap/loadSeeders.js` | Each file exports `{ model, count, generate(i) }` — auto-discovered |

### Middleware Pipeline

Defined in `src/config/system.js` — order matters:

```
favicon → helmet → cors → cookieParser() → json(limit) → urlencoded(extended)
  → rateLimiter → perfMonitor → tracer → injectServices → responder
    → routes → fallback → errorHandler
```

Add new middleware by adding its key to `MIDDLEWARE_PIPELINE` and registering in `middlewareMap` in `bootstrap/index.js`. Middleware factories (from `authorize`, `rateLimiter`, `validation`, `upload`) attach a `_label` property so `npm run routes` displays them with their parameters.

### Request Lifecycle

```
Request → pipeline → routes → [...per-route middleware] → controller → service → repository → strategy
  ├── per-route: authenticate / authorize / validate / validateQuery / createRateLimiter / upload
  ├── controller uses res.respond() / res.paginated() / res.fail() for consistent envelopes
  └── errorHandler catches all (typed errors → JSON)
```

---

## CLI

```bash
# Scaffolding (Laravel-style)
npm run make:controller -- Product    # src/controllers/product.controller.js
npm run make:route -- Product         # CRUD route files
npm run make:service -- Product       # src/services/productService.js
npm run make:repository -- Product    # src/repositories/product.repository.js
npm run make:validation -- Product    # Joi schemas (create, update, list)
npm run make:model -- Product         # Mongoose model
npm run make:seeder -- Product        # Faker seeder definition
npm run make:all -- Product           # Everything + prints container registration snippet

# Route lister
npm run routes                        # Colour-coded methods, clickable links, middleware

# Database seeding
npm run seed                          # Seed all (development only — refuses in production)
npm run seed -- --clean               # Drop + reseed
npm run seed -- --only user           # Seed a specific seeder
```

---

## Quick Start

```bash
# Local (requires MongoDB)
cp .env.development.example .env.development
npm install
npm run dev
```

```bash
# Docker
docker compose up app_dev mongodb_dev

# Tests
npm test                          # 85 tests, 8 suites
docker compose up mongodb_test app_test
```

### API Endpoints

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | — | 10/min | Create account |
| POST | `/api/v1/auth/login` | — | 5/min | Get tokens (access + refresh in JSON + cookie) |
| POST | `/api/v1/auth/refresh-token` | Cookie | 20/min | Refresh tokens |
| POST | `/api/v1/auth/forgot-password` | — | — | Request password reset |
| POST | `/api/v1/auth/reset-password` | — | — | Reset password with token |
| GET | `/api/v1/auth/me` | Bearer | — | Current user profile |
| GET | `/api/v1/users/:id` | Bearer | — | Get user by ID |
| GET | `/api/v1/users` | Bearer | — | List users (page, limit, sort, search) |
| GET | `/health` | — | — | System health + DB status |
| GET | `/api-docs` | — | — | Swagger UI (dev only) |

---

## Configuration

| Config | Env Var | Default | Description |
|---|---|---|---|
| Route prefix | `ROUTE_PREFIX` | `/api/v1` | API mount point + scan directory |
| Port | `PORT` | `3000` | HTTP server port |
| Body limit | `BODY_LIMIT` | `1mb` | Max request body size |
| DB driver | `DB_DRIVER` | `mongo` | `mongo` or `postgres` |
| Storage driver | `STORAGE_DRIVER` | `local` | `local` or `s3` |
| Email driver | `EMAIL_DRIVER` | `console` | `console` or `stub` |
| JWT secret | `JWT_SECRET` | — | Access token signing key |
| JWT refresh secret | `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| CORS origin | `CORS_ORIGIN` | `*` | Allowed origins |
| Rate limit max | `RATE_LIMIT_MAX` | `100` | Requests per 15min window |

---

## Testing

```bash
npm test                          # 85 tests, 8 suites, ~6s
```

| Suite | Tests | What it covers |
|---|---|---|
| `auth.int.test.js` | 25 | Full auth flow |
| `auth.middleware.test.js` | 10 | Authenticate + authorize |
| `dynamic-routes.test.js` | 7 | Path params, query validation |
| `strategies.test.js` | 20 | Mongo, Postgres, LocalStorage, S3Storage |
| Other suites | 23 | Rate limiter, security repo, env, init |

---

## License

MIT — see [LICENSE](LICENSE)
