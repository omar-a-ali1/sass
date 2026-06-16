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
- **App Assembly**: [`src/app.js`](../src/app.js)
- **IoC Container**: [`src/services/container.js`](../src/services/container.js)
- **Auth Middleware**: [`src/middlewares/auth.js`](../src/middlewares/auth.js)
- **Rate Limiter Factory**: [`src/middlewares/rateLimiter.js`](../src/middlewares/rateLimiter.js)
- **API Routes**: [`src/routes/v1/auth.js`](../src/routes/v1/auth.js)
- **Database Strategy**: [`src/strategies/database/mongo.strategy.js`](../src/strategies/database/mongo.strategy.js)
- **Storage Strategy**: [`src/strategies/storage/localStorage.strategy.js`](../src/strategies/storage/localStorage.strategy.js)
- **Model Auto-Loader**: [`src/models/index.js`](../src/models/index.js)
- **Error Base**: [`src/errors/appErrors.js`](../src/errors/appErrors.js)
- **Logger**: [`src/utils/logger.js`](../src/utils/logger.js)

## What's Implemented (see [todo](todo))

- Auth: register, login (access+refresh tokens), refresh-token endpoint, JWT middleware
- Strategy: MongoStrategy, LocalStorageStrategy (full); PostgresStrategy, S3StorageStrategy (stubs)
- Per-route rate limiting: `createRateLimiter()` factory with per-endpoint limits (5/min login, 10/min register, 20/min refresh)
- Model auto-loader — drop a file in `src/models/`, it's registered automatically
- Repositories are engine-agnostic via injected `dbStrategy`
- 50 integration tests across 7 suites (auth endpoints, middleware, strategies, rate limiter, security)
- All `.env` files include storage config vars; `prodcution` typo fixed
