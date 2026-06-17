<p align="center">
  <img src="assets/logo.png" alt="SASS Framework Logo" width="120"/>
</p>

<h1 align="center">SASS Framework</h1>

<p align="center">
  <strong>S</strong>calable <strong>A</strong>rchitecture for <strong>S</strong>erver-side <strong>S</strong>ystems
  <br>
  A production-ready Node.js + Express mini-framework with DI container, strategy pattern, JWT auth, and auto-discovery.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-22.x-green" alt="Node"/>
  <img src="https://img.shields.io/badge/express-5.x-blue" alt="Express"/>
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License"/>
  <img src="https://img.shields.io/badge/tests-50_/_50_pass-brightgreen" alt="Tests"/>
</p>

---

## Features

- **Dependency Injection** — Map-based IoC container with lifecycle registration
- **Strategy Pattern** — Pluggable backends (MongoStrategy, LocalStorageStrategy implemented; PostgresStrategy, S3StorageStrategy stubs)
- **JWT Auth** — Access + refresh token flow with Bearer middleware
- **Per-Route Rate Limiting** — Configurable limits per endpoint (5/min login, 10/min register, 20/min refresh)
- **Auto-Discovery** — Models, routes, and Swagger docs auto-load from directory structure
- **Typed Errors** — Consistent JSON error responses via error hierarchy
- **Swagger/OpenAPI** — Auto-generated from route `docs` properties + Joi schemas
- **Winston Logging** — Structured logging with file transports
- **Docker** — Multi-stage build + Docker Compose (dev, test, prod)

---

## Project Structure

```
├── server.js                          # Entry point
├── src/
│   ├── app.js                         # Express assembly
│   ├── config/
│   │   ├── environment.js             # Env loading + validation
│   │   ├── database.js                # MongoDB connection
│   │   └── security.js                # Helmet, CORS, rate-limit config
│   ├── constants/system.js            # HTTP codes, security defaults
│   ├── controllers/                   # Request/response handling
│   ├── errors/                        # Error hierarchy (AppError → 4xx/5xx)
│   ├── helpers/                       # Joi formatting, data sanitization
│   ├── middlewares/
│   │   ├── auth.js                    # JWT Bearer verification
│   │   ├── errorHandler.js            # Global error serializer
│   │   ├── injectServices.js          # IoC container injection
│   │   ├── rateLimiter.js             # Per-route rate limiter factory
│   │   ├── tracer.js                  # Request ID + Morgan logging
│   │   └── validation.js              # Joi schema validation
│   ├── models/
│   │   ├── index.js                   # Auto-loader (scans directory)
│   │   └── User.js                    # Mongoose schema
│   ├── repositories/                  # Data access layer
│   ├── routes/
│   │   ├── index.js                   # Root router
│   │   ├── v1/
│   │   │   ├── index.js               # Auto-loader (delegates to loader.js)
│   │   │   ├── loader.js              # Recursive directory scanner
│   │   │   └── auth/
│   │   │       ├── login.js           # POST /login
│   │   │       ├── register.js        # POST /register
│   │   │       └── refresh-token.js   # POST /refresh-token
│   │   └── swagger/
│   │       ├── index.js               # OpenAPI root (auto-generated paths)
│   │       ├── loader.js              # Swagger doc generator from route defs
│   │       └── components/            # Shared schemas, responses
│   ├── services/
│   │   └── container.js               # DI container + wiring
│   ├── strategies/
│   │   ├── database/
│   │   │   ├── mongo.strategy.js      # Full Mongoose implementation
│   │   │   └── postgres.strategy.js   # Stub
│   │   └── storage/
│   │       ├── localStorage.strategy.js  # Full filesystem implementation
│   │       └── s3Storage.strategy.js     # Stub
│   ├── tests/                         # 50 integration tests
│   └── validation/                    # Joi schemas
├── docker-compose.yaml
├── Dockerfile
└── .env.{development,production,test}
```

---

## Architecture Patterns

### Dependency Injection

All dependencies are wired in `src/services/container.js`. Controllers retrieve services via `req.getService('name')` — never `new`.

```
container.register('dbStrategy', new MongoStrategy())
  → UserRepository receives dbStrategy
    → AuthService receives UserRepository + SecurityService
      → Controller calls req.getService('authService')
```

### Strategy Pattern

Backends are swappable by config. Each strategy implements the same interface:

| Domain | Active | Stub |
|---|---|---|
| Database | `MongoStrategy` | `PostgresStrategy` |
| Storage | `LocalStorageStrategy` | `S3StorageStrategy` |

### Auto-Discovery

| Layer | Mechanism | Convention |
|---|---|---|
| Models | `models/index.js` scans `models/` | `mongoose.model('Name', schema)` auto-registers |
| Routes | `v1/loader.js` recursively scans `v1/` | Each file exports `{ method, path, middleware, handler }` |
| Swagger | `swagger/loader.js` reads route `docs` props | Add `docs: { tags, summary, requestBody, responses }` to route files |

### Request Lifecycle

```
Request → express.json() → tracer → injectServices → routes
  ├── rateLimiter (per-route)
  ├── authenticate (per-route, optional)
  ├── validation (Joi)
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
| POST | `/api/v1/auth/login` | — | 5/min | Get tokens |
| POST | `/api/v1/auth/refresh-token` | — | 20/min | Refresh tokens |
| GET | `/health` | — | — | System health |
| GET | `/api-docs` | — | — | Swagger UI |

---

## Adding a Feature

1. Create route file: `src/routes/v1/{resource}/{action}.js`
2. Export `{ method, path, middleware, handler, docs? }`
3. Add service + repository methods if needed
4. Done — route is live, Swagger auto-generated

---

## Testing

```bash
npm test                          # 50 tests, 7 suites
./command/test.sh                 # Docker test runner
```

---

## License

MIT — see [LICENSE](LICENSE)
