# SASS Framework — Documentation Index

> **Version**: 1.0.0 &middot; **Status**: Stable
>
> **S**calable **A**rchitecture for **S**erver-side **S**ystems  
> A production-ready Node.js + Express mini-framework with DI container, strategy pattern, JWT auth, auto-discovery, CLI scaffolding, and seeder system.

## Documents

| Document | Description |
|---|---|
| [API Reference](api-reference.md) | Complete function-by-function reference for every file in the codebase |
| [Architecture & Patterns](architecture-patterns.md) | Architectural design, 5 core patterns, end-to-end request lifecycle, dependency graph |
| [CLI Reference](cli-reference.md) | All npm scripts (`make:*`, `routes`, `seed`) and Docker CLI commands |
| [Infrastructure & DevOps](infrastructure.md) | Docker multi-stage build, Docker Compose, environment config, logging system, scripts |
| [Building Routes](building-routes.md) | Junior vs professional approach, route file contract, full stack example |

## Quick Links

- **Entry Point**: [`server.js`](../server.js)
- **Bootstrap Orchestrator**: [`src/bootstrap/index.js`](../src/bootstrap/index.js)
- **Route Auto-Loader**: [`src/bootstrap/loadRoutes.js`](../src/bootstrap/loadRoutes.js)
- **Swagger Auto-Generator**: [`src/bootstrap/loadSwagger.js`](../src/bootstrap/loadSwagger.js)
- **Model Auto-Loader**: [`src/bootstrap/loadModels.js`](../src/bootstrap/loadModels.js)
- **IoC Container**: [`src/bootstrap/container.js`](../src/bootstrap/container.js) (auto-discovered by [`src/bootstrap/loadContainer.js`](../src/bootstrap/loadContainer.js))
- **Auth Middleware**: [`src/middlewares/auth.js`](../src/middlewares/auth.js)
- **Authorize Middleware**: [`src/middlewares/authorize.js`](../src/middlewares/authorize.js)
- **Rate Limiter Factory**: [`src/middlewares/rateLimiter.js`](../src/middlewares/rateLimiter.js)
- **Validation Middleware**: [`src/middlewares/validation.js`](../src/middlewares/validation.js)
- **Perf Monitor**: [`src/middlewares/perfMonitor.js`](../src/middlewares/perfMonitor.js)
- **Cookie Parser**: `cookie-parser` (npm package)
- **API Routes**: [`src/routes/api/v1/auth/`](../src/routes/api/v1/auth/)
- **Error Base**: [`src/errors/appErrors.js`](../src/errors/appErrors.js)
- **Logger**: [`src/utils/logger.js`](../src/utils/logger.js)

## What's Implemented

- Auth: register, login (access+refresh tokens), refresh-token, forgot-password, reset-password, get profile
- JWT middleware with Bearer + cookie fallback + role-based `authorize()`
- Strategy: MongoStrategy, PostgresStrategy, LocalStorageStrategy, S3StorageStrategy, ConsoleEmailStrategy, StubEmailStrategy
- Per-route rate limiting: `createRateLimiter()` factory
- Auto-model loading: drop a file in `src/models/`, it's registered + auto-converted to OpenAPI schema
- Auto-route loading: directory hierarchy maps to URL paths — drop a file, it's live
- Auto-Swagger: Joi body schemas, query schemas, path params (`:id`), auth middleware all auto-detected
- Dynamic routes via `path: '/:id'` export
- Query validation via `validateQuery(joiSchema)`, auto-documented
- Configurable middleware pipeline, route prefix, and swagger info from config files
- Performance monitoring with `/health/metrics` endpoint
- Request body size limit configurable via `BODY_LIMIT` env var
- Cookie parser middleware (npm `cookie-parser` package)
- 85 integration tests across 8 suites

## CLI & Docker

The framework ships with two command interfaces:

- **npm scripts** — `npm run make:*`, `npm run routes`, `npm run seed` — for direct host usage
- **Docker CLI** — `bash docker-cli/{dev,test,seed}.sh` — predefined Compose workflows with MongoDB health checks

See the [CLI Reference](cli-reference.md) for the full command catalogue.
