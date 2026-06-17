# SASS Framework

> **S**calable **A**rchitecture for **S**erver-side **S**ystems — A lightweight mini-framework built on Node.js and Express for building maintainable, testable, and scalable backend applications.

---

## Architecture

SASS is designed around four core software architecture patterns that work together to enforce clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                        Routes                           │
│                    (HTTP Mapping)                       │
├─────────────────────────────────────────────────────────┤
│                     Middleware                          │
│            (Tracing · DI Injection · Validation)        │
├─────────────────────────────────────────────────────────┤
│                     Controllers                         │
│              (Request/Response Handling)                │
├─────────────────────────────────────────────────────────┤
│                       Services                          │
│                  (Business Logic)                       │
├─────────────────────────────────────────────────────────┤
│                    Repositories                         │
│              (Data Access Abstraction)                  │
├─────────────────────────────────────────────────────────┤
│                   Models / Strategies                   │
│             (ODM Schemas · Swappable Backends)          │
└─────────────────────────────────────────────────────────┘
```

### Patterns Used

| Pattern | Implementation | Purpose |
|---|---|---|
| **Dependency Injection / IoC** | `src/services/container.js` | Centralized service resolution; controllers never instantiate dependencies directly |
| **Repository Pattern** | `src/repositories/user.repository.js` | Abstracts data access behind a clean interface; ORM-swappable |
| **Strategy Pattern** | `src/strategies/` | Pluggable backends for databases, storage, and email |
| **Middleware Pipeline** | `src/middlewares/` | Cross-cutting concerns (tracing, validation, error handling) as composable Express middleware |
| **Error Hierarchy** | `src/errors/` | Typed operational errors with consistent JSON serialization |

---

## Project Structure

```
├── server.js                         # Entry point: HTTP server + Socket.IO + DB connect
├── src/
│   ├── app.js                        # Express app assembly & middleware registration
│   ├── config/
│   │   ├── database.js               # Mongoose connection
│   │   ├── environment.js            # Env loading & validation
│   │   └── security.js               # Helmet, rate-limit, CORS
│   ├── constants/
│   │   └── system.js                 # HTTP status codes & security defaults
│   ├── controllers/
│   │   ├── auth.controller.js        # Auth request/response handling
│   │   └── health.controller.js      # Health check endpoint
│   ├── errors/
│   │   ├── appErrors.js              # Base AppError class
│   │   ├── ConflictError.js          # 409
│   │   ├── NotFoundError.js          # 404
│   │   ├── ServerError.js            # 500
│   │   ├── UnauthorizedError.js      # 401
│   │   └── ValidationError.js        # 400
│   ├── helpers/
│   │   └── formatJoiErrors.js        # Joi error formatter
│   ├── middlewares/
│   │   ├── errorHandler.js           # Global error handler
│   │   ├── injectServices.js         # IoC container → req.getService()
│   │   ├── tracer.js                 # Request ID + Morgan logging
│   │   └── validation.js             # Joi schema validation
│   ├── models/
│   │   └── User.js                   # Mongoose User model (bcrypt hashing)
│   ├── repositories/
│   │   └── user.repository.js        # Data access layer (Repository pattern)
│   ├── routes/
│   │   ├── index.js                  # Root router
│   │   ├── health.js                 # /health
│   │   ├── defaults/fallback.js      # 404 handler
│   │   └── v1/
│   │       ├── index.js              # v1 aggregator
│   │       └── auth.js               # POST /auth/register
│   ├── services/
│   │   ├── authService.js            # Business logic
│   │   └── container.js              # IoC DependencyContainer
│   ├── strategies/
│   │   ├── database/                 # mongo.strategy.js, postgres.strategy.js
│   │   ├── email/                    # (planned)
│   │   └── storage/                  # localStorage.strategy.js, s3Storage.strategy.js
│   ├── tests/
│   ├── utils/
│   │   └── logger.js                 # Winston logger
│   └── validation/
│       └── auth/login.js             # Joi schema
├── storage/logs/                     # Log output
├── Dockerfile                        # Multi-stage build
├── docker-compose.yaml               # MongoDB + app services
└── .env.*                            # Environment configs
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (optional, for MongoDB)

### Quick Start (Local)

```bash
# Install dependencies
npm install

# Start MongoDB (or use your own)
docker compose up mongodb_dev -d

# Start dev server with hot-reload
npm run dev
```

### Quick Start (Docker)

```bash
./command/dev.sh
# or
docker compose up app_dev mongodb_dev
```

Server starts at `http://localhost:5000`.

---

## How the Patterns Work

### 1. Dependency Injection / IoC Container

The `DependencyContainer` (`src/services/container.js`) is a simple Map-based registry:

```js
class DependencyContainer {
  register(name, instance) { this.services.set(name, instance); }
  get(name) { return this.services.get(name); }
}
```

Services are registered at startup with their dependencies injected:

```js
const userRepository = new UserRepository();
const authService    = new AuthService({ userRepository });
container.register('authService', authService);
```

The `injectServices` middleware attaches the container to every request:

```js
// In any controller:
const authService = req.getService('authService');
```

This means controllers never call `new` — they ask for what they need.

### 2. Repository Pattern

Repositories wrap data access behind a consistent interface, decoupling business logic from the ORM:

```js
class UserRepository {
  async findByEmail(email) { return User.findOne({ email }); }
  async create(data)       { return User.create(data); }
}
```

Services depend on the repository interface, not on Mongoose directly. To switch from MongoDB to PostgreSQL, only the repository and strategy change — the service stays the same.

### 3. Strategy Pattern (Planned)

The `src/strategies/` directory holds interfaces for swappable backends:

- **Database**: `mongo.strategy.js` ↔ `postgres.strategy.js`
- **Storage**: `localStorage.strategy.js` ↔ `s3Storage.strategy.js`
- **Email**: (open for provider implementations)

Each strategy pair implements a shared interface, selected via configuration or dependency injection.

### 4. Middleware Pipeline

Cross-cutting concerns are composed as Express middleware:

| Middleware | Role |
|---|---|
| `tracer` | Assigns `req.id` + Morgan HTTP logging via Winston |
| `injectServices` | Attaches IoC container to request |
| `validation` | Joi schema validation → `req.validatedBody` |
| `errorHandler` | Catches all errors → structured JSON response |

### 5. Error Hierarchy

```
Error → AppError → ConflictError (409)
                 → NotFoundError (404)
                 → ServerError (500)
                 → UnauthorizedError (401)
                 → validationError (400)
```

All operational errors return a consistent JSON shape:

```json
{
  "success": false,
  "status": "fail",
  "traceId": "abc-123",
  "error": {
    "message": "Resource not found",
    "fields": {}
  }
}
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root health check |
| `GET` | `/health` | System health (DB status, uptime, memory) |
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | User login (placeholder) |

---

## Environment Configuration

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `5000` | HTTP server port |
| `MONGO_URI` | `mongodb://mongodb_dev:27017/framework_dev` | MongoDB connection string |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | — | Token expiry duration |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

Environment-specific files: `.env.development`, `.env.production`, `.env.test`.

---

## Testing

```bash
# Unit tests
npm test

# Docker test environment
./command/test.sh
```

Tests use Jest with a dedicated MongoDB instance and `.env.test` configuration.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |
| `./command/dev.sh` | Docker Compose dev environment |
| `./command/test.sh` | Docker Compose test environment |

---

## License

MIT © OMAR AIT ALI
