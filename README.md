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
- **Strategy Pattern** — Pluggable backends (Mongo/Postgres for DB, Local/S3 for storage, Console/Stub for email)
- **Database Transactions** — `withTransaction()` on both strategies with unified `trx` proxy API; row-level locking (`forUpdate`/`forFind`) on Postgres
- **Cross-Model Joins** — `db.join()` with pagination, works on both Mongo (`$lookup`) and Postgres (`LEFT JOIN`)
- **JWT Auth** — Access + refresh token flow with Bearer + cookie fallback, role-based `authorize()`, forgot/reset password
- **Auto-Discovery** — Models, routes, and Swagger docs auto-load from directory structure — zero manual wiring
- **Auto-Swagger** — OpenAPI 3.0 generated from route `docs` + auto-detected Joi body/query schemas + auto-detected `authenticate` middleware + `:id` params. Error responses (400, 401, 403, 500) auto-included
- **Swagger UI** — Interactive docs at `/api-docs` (development only)
- **Paginated Queries** — `paginate()` with skip/limit + total count, unified across both DB strategies
- **Response Envelope** — `res.respond()`, `res.paginated()`, `res.fail()` — consistent JSON shape with `traceId`
- **File Uploads** — Multer bridge → storage strategy. Factory `upload({ field, maxSize })` returns middleware array
- **API Key Management** — Generate, validate (bcrypt), and revoke API keys with `X-API-Key` authentication middleware
- **Soft Delete** — `softDelete()` / `restore()` methods on both database strategies, `deletedAt` field support
- **Seeder System** — Auto-discovers `*.seeder.js` in `src/seeders/`, driver-aware (Mongo + Postgres)
- **CLI Scaffolding** — Laravel-style `npm run make:controller|route|service|repository|validation|model|seeder|all`
- **Route Lister** — `npm run routes` — colour-coded methods, clickable links, middleware chain
- **Model Inspector** — `npm run models` — lists models, tables, and column types per driver
- **DB Query CLI** — `npm run fetch -- <Model>` — query records with `--id`, `--where`, `--limit`, `--sort`, `--raw`
- **Configurable Middleware Pipeline** — Ordered middleware array in config, injected at bootstrap
- **Performance Monitoring** — In-memory metrics at `/health/metrics`
- **Dynamic Routes** — Path params (`:id`) auto-detected in Swagger
- **Per-Route Rate Limiting** — Declarative `rateLimit` property on route definitions
- **Query Validation** — `validateQuery(joiSchema)` validates `req.query`, auto-documented in Swagger
- **Typed Errors** — Consistent JSON error responses via error hierarchy
- **Winston Logging** — Structured logging with file transports
- **Docker** — Multi-stage build + Docker Compose (dev, test, prod) with PostgreSQL + MongoDB

---

## Project Structure

```
├── server.js                          # Entry point
├── cli/
│   ├── make.js                        # Scaffold generator (make:*)
│   ├── list-routes.js                 # Route lister
│   ├── list-models.js                 # Model/table inspector
│   ├── fetch.js                       # DB query CLI
│   └── seed.js                        # Seeder runner (driver-aware)
├── docker-cli/
│   ├── dev.sh                         # Start dev with MongoDB
│   ├── dev-postgres.sh                # Start dev with PostgreSQL
│   ├── test.sh                        # Run tests in Docker
│   └── ...
├── src/
│   ├── bootstrap/
│   │   ├── index.js                   # Express app assembly
│   │   ├── loadModels.js              # Auto-scans models/
│   │   ├── loadRoutes.js              # Recursively scans routes/ → Router
│   │   ├── loadSwagger.js             # OpenAPI 3.0 generator
│   │   ├── loadContainer.js           # IoC container (strategies → repos → services)
│   │   └── loadSeeders.js             # Driver-aware seeder runner
│   ├── config/
│   │   ├── environment.js             # Env loading
│   │   ├── database.js                # Connection
│   │   ├── security.js                # Helmet, CORS, rate-limit
│   │   └── system.js                  # Pipeline, HTTP codes
│   ├── controllers/                   # Request/response handling
│   ├── errors/                        # AppError → 4xx/5xx
│   ├── middlewares/                   # auth, authorize, validation, upload, rateLimiter...
│   ├── models/                        # Mongoose schemas
│   ├── repositories/                  # Data access layer
│   ├── routes/
│   │   ├── index.js                   # GET /
│   │   ├── health/                    # /health, /health/metrics
│   │   └── api/v1/                    # auth/, users/, api-keys/
│   ├── seeders/                       # Faker-based seed definitions
│   ├── services/                      # Business logic
│   ├── lib/strategies/
│   │   ├── database/
│   │   │   ├── mongo.strategy.js      # Mongoose — CRUD, paginate, join, withTransaction
│   │   │   └── postgres.strategy.js   # pg.Pool — same + forUpdate/forFind, rawQuery
│   │   ├── storage/
│   │   │   ├── localStorage.strategy.js
│   │   │   └── s3Storage.strategy.js
│   │   └── email/
│   │       ├── consoleEmail.strategy.js
│   │       └── stubEmail.strategy.js
│   ├── tests/                         # 117 tests, 12 suites
│   ├── utils/                         # Logger, sanitize, formatJoiErrors
│   └── validation/                    # Joi schemas
├── docs/                              # Full documentation
├── docker-compose.yaml
├── Dockerfile
└── .env.{development,test}
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
npm run seed                          # Seed all (driver-aware)
npm run seed -- --clean               # Drop + reseed
npm run seed -- --only user           # Seed only one
npm run models                        # List tables + columns
npm run fetch -- User                 # Query records
npm run fetch -- User --id 1          # By ID
```

### Routing & Dev

```bash
npm run routes                        # Colour-coded route list
npm run dev                           # Dev server (node --watch)
npm start                             # Production server
npm test                              # 117 tests, 12 suites
```

---

## Docker CLI

```bash
bash docker-cli/dev.sh                # Dev with MongoDB
bash docker-cli/dev-postgres.sh       # Dev with PostgreSQL
bash docker-cli/test.sh               # Run tests
bash docker-cli/seed.sh               # Seed database
bash docker-cli/models.sh             # Inspect models
bash docker-cli/fetch.sh User --limit 5
```

---

## Database Features

### Cross-Model Joins

Query related data across tables/collections with a single call — works on both strategies:

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

All strategy methods called on the `trx` proxy participate in the transaction. On throw → full rollback.

### Row-Level Locking (Postgres)

```js
await db.withTransaction(async (trx) => {
  const account = await trx.forUpdate('Account', accountId);        // single row
  const pending = await trx.forFind('Transaction', { status: 'pending' }); // multiple rows
});
```

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

| Domain | Active | Alternate | New Features |
|---|---|---|---|
| Database | `MongoStrategy` | `PostgresStrategy` | `join`, `withTransaction`, `softDelete`, `restore` |
| Storage | `LocalStorageStrategy` | `S3StorageStrategy` | `upload`, `delete`, `getUrl` |
| Email | `ConsoleEmailStrategy` | `StubEmailStrategy` | `send` |

Switch drivers by changing `DB_DRIVER`, `STORAGE_DRIVER`, or `EMAIL_DRIVER` in `.env`.

### Middleware Pipeline

```
favicon → helmet → cors → cookieParser → json(limit) → urlencoded
  → rateLimiter → perfMonitor → tracer → injectServices → responder
    → activityLog → routes → fallback → errorHandler
```

Order defined in `MIDDLEWARE_PIPELINE` in `src/config/system.js`.

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
| `PORT` | `5000` | HTTP port |
| `BODY_LIMIT` | `1mb` | Max request body |
| `DB_DRIVER` | `mongo` | `mongo` or `postgres` |
| `MONGO_URI` | `mongodb://localhost:27017/myapp_dev` | MongoDB URI |
| `POSTGRES_URI` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `CORS_ORIGIN` | `*` | Allowed origins |
| `RATE_LIMIT_MAX` | `100` | Requests per 15min window |

---

## Testing

```bash
npm test                          # 117 tests, 12 suites, ~10s
```

| Suite | Tests | Coverage |
|---|---|---|
| `auth.int.test.js` | 25 | Full auth flow |
| `auth.middleware.test.js` | 10 | Authenticate + authorize |
| `dynamic-routes.test.js` | 7 | Path params, query validation |
| `strategies.test.js` | 20 | Mongo, Postgres, LocalStorage, S3 |
| `apiKey.test.js` | 12 | API key generation, validation, revocation |
| `softDelete.strategy.test.js` | 4 | Soft delete |
| `email.strategy.test.js` | 3 | Console, SMTP, stub |
| `rateLimiter.test.js` | 8 | Rate limiter factory |
| `security.repository.test.js` | 10 | JWT + bcrypt |
| `env.test.js` | 3 | Env loading |
| `init.test.js` | 3 | Bootstrap |
| Static analysis | 14 | Lint-style checks |

---

## License

MIT — see [LICENSE](LICENSE)