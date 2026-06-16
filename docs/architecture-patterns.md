# SASS Framework — Architecture & Design Patterns

---

## Core Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    server.js                                 │
│         (HTTP Server · Socket.IO · DB Connect)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    app.js                                    │
│            (Express App Assembly)                             │
├─────────────────────────────────────────────────────────────┤
│  1. express.json()          — Body parsing                   │
│  2. tracer()                — Request ID + HTTP logging      │
│  3. injectServices()        — IoC container injection        │
│  4. routes()                — Route mounting                 │
│  5. errorHandler()          — Global error handler           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     Routes                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │   GET /  │  │ /health  │  │ /api/v1  │  │ /api-docs   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                    │  ┌─────────────┐                         │
│                    │  │ /auth       │                         │
│                    │  │ POST login  │                         │
│                    │  │ POST regis. │                         │
│                    │  └─────────────┘                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  fallback (404)                                       │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
┌─────────▼──────┐ ┌──▼────────┐ ┌─▼─────────────┐
│  VALIDATION    │ │  TRACER   │ │  injectServices│
│  Middleware    │ │  Morgan   │ │  → container   │
│  (Joi schema)  │ │  Winston  │ │  → getService()│
└─────────┬──────┘ └───────────┘ └───────┬─────────┘
          │                              │
          │                              ▼
          │                    ┌───────────────────┐
          │                    │   Controllers      │
          │                    │  (req/res handling)│
          │                    └────────┬──────────┘
          │                             │
          │                             ▼
          │                    ┌───────────────────┐
          │                    │    Services        │
          │                    │  (business logic)  │
          │                    └────────┬──────────┘
          │                             │
          │                             ▼
          │                    ┌───────────────────┐
          │                    │   Repositories     │
          │                    │  (data access)     │
          │                    └────────┬──────────┘
          │                             │
          │                             ▼
          │                    ┌───────────────────┐
          │                    │  Models/Strategies │
          │                    │  (ODM · Backends)  │
          │                    └───────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     errorHandler                             │
│              (catches all → structured JSON)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Dependency Injection / IoC Container

**File**: `src/services/container.js`

**Concept**: Centralized service resolution. Controllers and services never call `new` on their dependencies — they ask the container for what they need.

### How It Works

```js
class DependencyContainer {
  constructor() { this.services = new Map(); }
  register(name, instance) { this.services.set(name, instance); }
  get(name) {
    if (!this.services.has(name))
      throw new Error(`Service ${name} not found`);
    return this.services.get(name);
  }
}
```

**Registration at startup**:
1. `SecurityRepository` is instantiated
2. `SecurityService` receives `secRepository`
3. `UserRepository` is instantiated
4. `AuthService` receives `securityService` (from container) + `userRepository`
5. All are registered by name

**Injection into request**:
`injectServices` middleware attaches `req.getService(name)` so controllers can write:
```js
const authService = req.getService('authService');
```

**Why**: Decouples instantiation from usage. Makes unit testing trivial — mock services can be injected without modifying controller code.

---

## Pattern 2: Repository Pattern

**File**: `src/repositories/user.repository.js`

**Concept**: Abstracts data access behind a clean interface. Business logic (services) depends on the repository interface, not on Mongoose directly.

```js
class UserRepository {
  async findByEmail(email) { return User.findOne({ email }); }
  async create(data)       { return User.create(data); }
}
```

**Why**:
- ORM-swappable — switch from Mongoose to PostgreSQL by changing only the repository and strategy
- Testable — mock the repository in service tests
- Single responsibility — services focus on business rules, repositories focus on persistence

---

## Pattern 3: Strategy Pattern

**Directory**: `src/strategies/`

**Concept**: Pluggable backends for infrastructure concerns. Each domain (database, storage, email) defines an interface with multiple implementations.

| Domain | Implementations | Status |
|---|---|---|
| Database | `mongo.strategy.js` ↔ `postgres.strategy.js` | **Implemented** + Stub |
| Storage | `localStorage.strategy.js` ↔ `s3Storage.strategy.js` | **Implemented** + Stub |
| Email | `email/` directory | Planned |

**Database — MongoStrategy** (`src/strategies/database/mongo.strategy.js`): Full Mongoose wrapper with `create`, `findById`, `findOne`, `find`, `update`, `delete`, `count`. Each method resolves the model dynamically via `mongoose.model(modelName)`, so the strategy works with any registered model without hardcoding.

**Database — PostgresStrategy** (`src/strategies/database/postgres.strategy.js`): Stub implementing the same interface — each method throws `new Error('not implemented')`. Ready for PostgreSQL driver integration.

**Storage — LocalStorageStrategy** (`src/strategies/storage/localStorage.strategy.js`): Full filesystem storage using `fs/promises`. Accepts `{ uploadDir, baseUrl }` config. Methods: `upload(filename, buffer)` — writes to disk, returns `{ url, filename }`; `delete(filename)` — removes file; `getUrl(filename)` — returns public URL. Auto-creates `uploadDir` on instantiation.

**Storage — S3StorageStrategy** (`src/strategies/storage/s3Storage.strategy.js`): Stub with same interface — methods throw `new Error('not implemented')`. Ready for AWS SDK v3 integration.

**Wiring in container**:
```js
// src/services/container.js
const dbStrategy = config.database.driver === 'postgres'
  ? new PostgresStrategy()
  : new MongoStrategy();
container.register('dbStrategy', dbStrategy);
```

Repositories receive the strategy via constructor injection:
```js
class UserRepository {
  constructor({ dbStrategy }) {
    this.dbStrategy = dbStrategy;
  }
  async findByEmail(email) {
    return this.dbStrategy.findOne('User', { email });
  }
}
```

**Why**: Infrastructure decisions become configuration, not code changes. Swapping from MongoDB to PostgreSQL requires zero service/controller changes — only a new strategy class and a config toggle.

---

## Pattern 4: Middleware Pipeline

**Directory**: `src/middlewares/`

**Concept**: Cross-cutting concerns are composed as Express middleware in a specific order.

| Order | Middleware | Role | Key Detail |
|---|---|---|---|---|
| 1 | `express.json()` | Body parsing | — |
| 2 | `tracer` | Request ID + HTTP logging | Assigns `req.id` from `X-Request-ID` or `crypto.randomUUID()`. Logs via Morgan → Winston. |
| 3 | `injectServices` | IoC injection | Attaches `req.getService(name)` |
| 4 | `rateLimiter` (optional, per-route) | Rate limiting | Configurable via `createRateLimiter({ windowMs, max })`. Applied per-endpoint. |
| 5 | `authenticate` (optional, per-route) | JWT auth | Extracts Bearer, verifies via `verifyJwt()`, sets `req.user`. |
| 6 | Route-specific `validation` | Schema validation | Validates `req.body` via Joi → `req.validatedBody` |
| 7 | `errorHandler` | Error serialization | Returns structured JSON: `{ success, status, traceId, error }` |

**Why**: Middleware is composable, orderable, and reusable. Each concern is isolated in its own file.

---

## Pattern 5: Error Hierarchy

**Directory**: `src/errors/`

**Concept**: Typed operational errors with consistent JSON serialization.

```
Error
 └── AppError (base)
      ├── ConflictError       (409)
      ├── NotFoundError       (404)
      ├── ServerError         (500)
      ├── UnauthorizedError   (401)
      └── validationError     (400)
```

**`AppError` base class**:
- Looks up standard message from `HTTP_REQUESTS` table by status code
- Sets `isOperational = true` (distinguishes expected errors from programmer bugs)
- Sets `status` based on code range: `'fail'` for 4xx, `'error'` for 5xx

**Consistent response shape**:
```json
{
  "success": false,
  "status": "fail",
  "traceId": "a1b2c3d4",
  "error": {
    "message": "Human-readable message",
    "stack": "(only in development)",
    "fields": { "email": ["email must be a valid email"] }
  }
}
```

**Why**:
- API consumers get a predictable error format
- Error type can be checked with `instanceof`
- Stack traces are hidden in production automatically
- `fields` property enables per-field validation error reporting

---

## Request Lifecycle (End-to-End)

```
1. HTTP Request arrives
2. server.js (http.Server)
3. app.js middleware chain:
   a. express.json() → parses body
   b. tracer → assigns req.id, logs request
   c. injectServices → attaches IoC container
   d. routes → matches URL
4. Per-route middleware (if configured):
   a. authenticate → verifies Bearer JWT → sets req.user
   b. validate → Joi validates req.body
      - On fail → ValidationError → errorHandler
      - On success → req.validatedBody set
5. Controller:
   - Gets service via req.getService()
   - Calls service method with validated data
6. Service:
   - Business logic (e.g., check duplicates, compare passwords)
   - Calls repository methods
7. Repository:
   - Data access via injected dbStrategy (engine-agnostic)
8. Response sent as JSON
9. If any step throws → errorHandler catches it
```

---

## Dependency Graph

```
server.js
  ├── app.js
  │   ├── middlewares/tracer.js ──── utils/logger.js
  │   ├── middlewares/injectServices.js ──── services/container.js
  │   │   ├── models/index.js (auto-loader) ──── models/User.js
  │   │   ├── strategies/database/mongo.strategy.js (via config)
  │   │   ├── strategies/storage/localStorage.strategy.js (via config)
  │   │   ├── services/authService.js
  │   │   │   ├── repositories/user.repository.js
  │   │   │   │   └── strategies/database/mongo.strategy.js (dbStrategy)
  │   │   │   └── errors/ConflictError.js ──── errors/appErrors.js ──── constants/system.js
  │   │   └── services/securityService.js
  │   │       └── repositories/security.repository.js
  │   ├── middlewares/auth.js ──── repositories/security.repository.js (verifyJwt)
  │   ├── routes/index.js
  │   │   ├── routes/health.js ──── controllers/health.controller.js
  │   │   ├── routes/v1/auth.js
  │   │   │   ├── middlewares/validation.js
  │   │   │   │   ├── helpers/formatJoiErrors.js
  │   │   │   │   └── errors/ValidationError.js
  │   │   │   ├── middlewares/auth.js (optional authenticate)
  │   │   │   └── controllers/auth.controller.js
  │   │   └── routes/defaults/fallback.js ──── errors/NotFoundError.js
  │   └── middlewares/errorHandler.js ──── utils/logger.js
  ├── config/environment.js
  ├── config/database.js ──── utils/logger.js
  └── utils/logger.js
```
