# SASS Framework — Documentation Index

> **S**calable **A**rchitecture for **S**erver-side **S**ystems

## Documents

| Document | Description |
|---|---|
| [API Reference](api-reference.md) | Complete function-by-function reference for every file in the codebase |
| [Architecture & Patterns](architecture-patterns.md) | Architectural design, 5 core patterns, end-to-end request lifecycle, dependency graph |
| [Infrastructure & DevOps](infrastructure.md) | Docker multi-stage build, Docker Compose, environment config, logging system, scripts |

## Quick Links

- **Entry Point**: [`server.js`](../server.js)
- **Bootstrap Orchestrator**: [`src/bootstrap/index.js`](../src/bootstrap/index.js)
- **Route Auto-Loader**: [`src/bootstrap/loadRoutes.js`](../src/bootstrap/loadRoutes.js)
- **Swagger Auto-Generator**: [`src/bootstrap/loadSwagger.js`](../src/bootstrap/loadSwagger.js)
- **Model Auto-Loader**: [`src/bootstrap/loadModels.js`](../src/bootstrap/loadModels.js)
- **IoC Container**: [`src/services/container.js`](../src/services/container.js)
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
- Auto-route loading: drop `{ method, path, middleware, handler }` in `src/routes/api/v1/`, it's live
- Auto-Swagger: Joi body schemas, query schemas, path params (`:id`), auth middleware all auto-detected
- Dynamic routes via `path: '/:id'` export
- Query validation via `validateQuery(joiSchema)`, auto-documented
- Configurable middleware pipeline, route prefix, and swagger info from config files
- Performance monitoring with `/health/metrics` endpoint
- Request body size limit configurable via `BODY_LIMIT` env var
- Cookie parser middleware (npm `cookie-parser` package)
- 85 integration tests across 8 suites
