# SASS Framework — Documentation Index

> **Version**: 1.1.0 &middot; **Status**: Stable
>
> **S**calable **A**rchitecture for **S**erver-side **S**ystems  
> A production-ready Node.js + Express mini-framework with DI container, strategy pattern, JWT auth, auto-discovery, CLI scaffolding, and seeder system.

## Documents

| Document | Description |
|---|---|
| [API Reference](api-reference.md) | Complete function-by-function reference for every file in the codebase |
| [Architecture & Patterns](architecture-patterns.md) | Architectural design, 5 core patterns, end-to-end request lifecycle, dependency graph |
| [CLI Reference](cli-reference.md) | All npm scripts (`make:*`, `routes`, `seed`, `models`, `fetch`) and Docker CLI commands |
| [Infrastructure & DevOps](infrastructure.md) | Docker multi-stage build, Docker Compose, environment config, logging system, scripts |
| [Building Routes](building-routes.md) | Junior vs professional approach, route file contract, full stack example |
| [Getting Started](tutorials/getting-started.md) | Clone → setup → structure → libraries → features → build routes (junior vs senior) → auto-discovery → configuration |
| [API Key Tutorial](tutorials/api-keys.md) | Create, use, protect routes, check permissions, and revoke API keys |

## Quick Links

- **Entry Point**: [`server.js`](../server.js)
- **Bootstrap Orchestrator**: [`src/bootstrap/index.js`](../src/bootstrap/index.js)
- **Route Auto-Loader**: [`src/bootstrap/loadRoutes.js`](../src/bootstrap/loadRoutes.js)
- **Swagger Auto-Generator**: [`src/bootstrap/loadSwagger.js`](../src/bootstrap/loadSwagger.js)
- **Model Auto-Loader**: [`src/bootstrap/loadModels.js`](../src/bootstrap/loadModels.js)
- **Seeder Runner**: [`src/bootstrap/loadSeeders.js`](../src/bootstrap/loadSeeders.js)
- **IoC Container**: [`src/bootstrap/container.js`](../src/bootstrap/container.js) (auto-discovered by [`src/bootstrap/loadContainer.js`](../src/bootstrap/loadContainer.js))
- **Auth Middleware**: [`src/middlewares/auth.js`](../src/middlewares/auth.js)
- **Authorize Middleware**: [`src/middlewares/authorize.js`](../src/middlewares/authorize.js)
- **Rate Limiter Factory**: [`src/middlewares/rateLimiter.js`](../src/middlewares/rateLimiter.js)
- **Validation Middleware**: [`src/middlewares/validation.js`](../src/middlewares/validation.js)
- **Perf Monitor**: [`src/middlewares/perfMonitor.js`](../src/middlewares/perfMonitor.js)
- **Cookie Parser**: `cookie-parser` (npm package)
- **Model Inspector CLI**: [`src/tools/cli/list-models.js`](../src/tools/cli/list-models.js)
- **DB Query CLI**: [`src/tools/cli/fetch.js`](../src/tools/cli/fetch.js)
- **API Routes**: [`src/routes/api/v1/auth/`](../src/routes/api/v1/auth/)
- **Error Base**: [`src/lib/errors/appErrors.js`](../src/lib/errors/appErrors.js)
- **Logger**: [`src/lib/utils/logger.js`](../src/lib/utils/logger.js)
- **Getting Started Tutorial**: [`docs/tutorials/getting-started.md`](tutorials/getting-started.md)
- **Simplify Proposal**: [`docs/proposals/simplify-core.md`](proposals/simplify-core.md)

## What's Implemented

- Auth: register, login (access+refresh tokens), refresh-token, forgot-password, reset-password, get profile
- JWT middleware with Bearer + cookie fallback + role-based `authorize()`
- Strategy: MongoStrategy, PostgresStrategy, LocalStorageStrategy, S3StorageStrategy, ConsoleEmailStrategy, StubEmailStrategy
- Per-route rate limiting: declarative `rateLimit` property on route definitions
- Auto-model loading: drop a file in `src/models/`, it's registered + auto-converted to OpenAPI schema
- Auto-route loading: directory hierarchy maps to URL paths — drop a file, it's live
- Auto-Swagger: Joi body schemas, query schemas, path params (`:id`), auth middleware all auto-detected
- Dynamic routes via `path: '/:id'` export
- Query validation via `validateQuery(joiSchema)`, auto-documented
- Configurable middleware pipeline, route prefix, and swagger info from config files
- Performance monitoring with `/health/metrics` endpoint
- Request body size limit configurable via `BODY_LIMIT` env var
- Cookie parser middleware (npm `cookie-parser` package)
- PostgreSQL support (pg.Pool strategy with full CRUD, pagination, seeding, model inspection)
- Model/table inspector CLI (`npm run models`)
- Database query CLI (`npm run fetch -- <Model>`)
- Driver-aware seeder system (Mongoose for Mongo, strategy methods for Postgres)
- API Key management (generate, validate, revoke) with `X-API-Key` auth middleware
- Soft delete support (`deletedAt` field, `softDelete()` / `restore()` strategy methods)
- SMTP email via nodemailer (falls back to console when unconfigured)
- Mongoose auto-schema sync — no migration tool needed
- 117 tests across 12 suites

## CLI & Docker

The framework ships with two command interfaces:

- **npm scripts** — `npm run make:*`, `npm run routes`, `npm run seed`, `npm run models`, `npm run fetch` — for direct host usage
- **Docker CLI** — `bash src/tools/docker-cli/{dev,dev-postgres,test,seed,models,fetch}.sh` — predefined Compose workflows with DB health checks

See the [CLI Reference](cli-reference.md) for the full command catalogue.
