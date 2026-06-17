# SASS Framework — Architecture & Design Patterns

---

## Core Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                     HTTP Request                            │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                    server.js                                │
│         (HTTP Server · Socket.IO · DB Connect)              │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│              bootstrap/index.js                             │
│         (Express App Assembly from config)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MIDDLEWARE_PIPELINE (ordered by config)              │   │
│  │  favicon → helmet → cors → cookieParser              │   │
│  │  → json(limit) → rateLimiter → perfMonitor           │   │
│  │  → tracer → injectServices → ROUTES → fallback       │   │
│  │  → errorHandler                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                  Route Matching                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐ │
│  │   GET /  │  │ /health  │  │ /api/{ver} │  │ /api-docs  │ │
│  └──────────┘  └──────────┘  └────────────┘  └────────────┘ │
│                    │  ┌─────────────────┐                    │
│                    │  │ auth/*          │                    │
│                    │  │ users/*         │                    │
│                    │  └─────────────────┘                    │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  fallback → NotFoundError                           │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────┬─────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
┌─────────▼──────┐ ┌──▼────────┐ ┌─▼──────────────┐
│  VALIDATION    │ │  AUTH     │ │  injectServices │
│  validate()    │ │authenticate│ │  → container   │
│  validateQuery │ │authorize() │ │  → getService()│
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
┌────────────────────────────────────────────────────────────┐
│                     errorHandler                            │
│              (catches all → structured JSON)                │
└────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Bootstrap & Auto-Discovery

**Directory**: `src/bootstrap/`

All auto-loading logic lives in `bootstrap/`. The orchestrator (`index.js`) runs these steps:

1. **`loadModels.js`** — Scans `src/models/`, `require()`s each file, registers Mongoose models, converts each to OpenAPI schema via `mongoose-to-swagger`
2. **`container.js`** — Initializes the IoC container with driver-selected strategies
3. **`loadRoutes.js`** — Recursively scans `routes/{routePrefix}/`, builds an Express Router from `{ method, path, middleware, handler }` exports
4. **`loadSwagger.js`** — Reads each route's `docs` + auto-detected Joi schemas + middleware + path params → generates OpenAPI 3.0 paths

### Route Auto-Discovery Convention

```
routes/api/v1/auth/login.js
  → exports { method: 'post', path: '/login', middleware: [...], handler: fn }
  → Registered as POST /api/v1/auth/login
```

No `loader.js`, `index.js`, or `app.use()` calls needed for new routes. Just create the file.

---

## Pattern 2: Configurable Middleware Pipeline

**File**: `src/config/system.js` → `MIDDLEWARE_PIPELINE`

The old approach hardcoded middleware order in `app.js`. Now the pipeline is a config array:

```js
MIDDLEWARE_PIPELINE: [
  'favicon', 'helmet', 'cors', 'cookieParser',
  'json', 'rateLimiter', 'perfMonitor',
  'tracer', 'injectServices',
]
```

In `bootstrap/index.js`, each key is looked up in `middlewareMap` and applied via `app.use()` in order. To add a new middleware:
1. Write it in `src/middlewares/`
2. Add it to `middlewareMap` in `bootstrap/index.js`
3. Add its key to `MIDDLEWARE_PIPELINE` in the desired position

---

## Pattern 3: Dependency Injection / IoC Container

**File**: `src/services/container.js`

Centralized service resolution with a Map-based container.

```js
class DependencyContainer {
  constructor() { this.services = new Map(); }
  register(name, instance) { this.services.set(name, instance); }
  get(name) { /* throws if not found */ }
}
```

### Driver-Based Strategy Selection

Strategies are selected at startup based on config, not hardcoded:

```js
const dbDriver = config.database.driver;
const DBStrategy = { mongo: MongoStrategy, postgres: PostgresStrategy }[dbDriver];
container.register('dbStrategy', new DBStrategy());

const storageDriver = config.storage.driver;
const StorageStrategy = { local: LocalStorageStrategy, s3: S3StorageStrategy }[storageDriver];
container.register('storageStrategy', new StorageStrategy(config.storage));

const emailDriver = config.email.driver;
const EmailStrategy = { console: ConsoleEmailStrategy, stub: StubEmailStrategy }[emailDriver];
container.register('emailStrategy', new EmailStrategy());
```

### Registration Order

1. Strategies (DB, storage, email)
2. Repositories (receive strategies via constructor)
3. Services (receive repositories via constructor)

### Injection into Request

`injectServices` middleware attaches `req.getService(name)` to every request:
```js
const authService = req.getService('authService');
```

**Why**: Decouples instantiation from usage. Makes unit testing trivial — just inject mocks.

---

## Pattern 4: Repository Pattern

**File**: `src/repositories/`

Repositories abstract data access behind a clean interface. They receive a `dbStrategy` via DI and never import Mongoose directly:

```js
class UserRepository {
  constructor({ dbStrategy }) { this.dbStrategy = dbStrategy; }
  async findByEmail(email) { return this.dbStrategy.findOne('User', { email }); }
}
```

**Why**:
- ORM-swappable — switch from MongoDB to PostgreSQL by changing only the strategy
- Testable — mock the repository in service tests
- Single responsibility — services focus on business rules, repositories on persistence

---

## Pattern 5: Strategy Pattern

**Directory**: `src/strategies/`

Pluggable backends for infrastructure concerns. Each domain defines an interface with multiple implementations.

| Domain | Implemented | Also Available |
|---|---|---|
| Database | `mongo.strategy.js` | `postgres.strategy.js` (full PG with lazy `pg.Pool`) |
| Storage | `localStorage.strategy.js` | `s3Storage.strategy.js` (full S3 with lazy `@aws-sdk/client-s3`) |
| Email | `consoleEmail.strategy.js` | `stubEmail.strategy.js` (placeholder) |

### MongoStrategy
Full Mongoose wrapper: `create`, `findById`, `findOne`, `find`, `update`, `delete`, `count`. Resolves models dynamically via `mongoose.model()`.

### PostgresStrategy
Full implementation using `pg.Pool`. Uses lazy `require('pg')` inside methods so the dependency is optional. Parameterised queries prevent SQL injection.

### LocalStorageStrategy
Full filesystem storage using `fs/promises`. Config: `{ uploadDir, baseUrl }`. Auto-creates upload directory.

### S3StorageStrategy
Full implementation using `@aws-sdk/client-s3`. Uses lazy `require()` for optional dependency. Methods: `upload` (PutObjectCommand), `delete` (DeleteObjectCommand), `getUrl`.

### Email Strategies
- `ConsoleEmailStrategy` — Logs email content to console (for development)
- `StubEmailStrategy` — Throws error (placeholder for real SMTP/SendGrid implementation)

**Why**: Infrastructure decisions become configuration, not code changes.

---

## Pattern 6: Error Hierarchy

**Directory**: `src/errors/`

```
Error
 └── AppError (base)
      ├── ConflictError       (409)
      ├── NotFoundError       (404)
      ├── ServerError         (500)
      ├── UnauthorizedError   (401)
      ├── ForbiddenError      (403)
      └── ValidationError     (400)
```

**AppError**: Looks up standard message from `HTTP_REQUESTS`, sets `isOperational = true`, sets `status` to `'fail'` (4xx) or `'error'` (5xx).

**Response shape:**
```json
{ "success": false, "status": "fail", "traceId": "a1b2c3d4", "error": { "message": "...", "stack": "(dev only)", "fields": {} } }
```

---

## Request Lifecycle (End-to-End)

```
1. HTTP Request arrives
2. server.js (http.Server + Socket.IO)
3. bootstrap/index.js creates Express app with configurable pipeline:
   a. favicon
   b. helmet → security headers
   c. cors → CORS
   d. cookieParser → req.cookies
   e. json({ limit }) → parses body
   f. rateLimiter → global rate limit
   g. perfMonitor → collects metrics
   h. tracer → req.id + Morgan/Winston logging
   i. injectServices → attaches IoC container
4. Route matching:
   a. /health → health controller
   b. /api-docs → Swagger UI
   c. /api/v1/* → auto-loaded Router
   d. fallback → 404
5. Per-route middleware (if configured):
   a. rateLimiter (optional, per-endpoint)
   b. authenticate → verifies JWT → req.user
   c. authorize → checks role
   d. validate / validateQuery → Joi validation → req.validatedBody / req.validatedQuery
6. Controller:
   - Gets service via req.getService()
   - Calls service method with validated data
7. Service:
   - Business logic (check duplicates, compare passwords, etc.)
   - Calls repository methods
8. Repository:
   - Data access via injected dbStrategy (engine-agnostic)
9. Response sent as JSON
10. If any step throws → errorHandler catches it
```

---

## Dependency Graph

```
server.js
  ├── src/bootstrap/index.js
  │   ├── loadModels.js ──── models/User.js (via mongoose-to-swagger → OpenAPI schemas)
  │   ├── services/container.js
  │   │   ├── strategies/database/mongo.strategy.js (or postgres — config-driven)
  │   │   ├── strategies/storage/localStorage.strategy.js (or s3 — config-driven)
  │   │   ├── strategies/email/consoleEmail.strategy.js (or stub — config-driven)
  │   │   ├── repositories/user.repository.js
  │   │   │   └── strategies/database/*.strategy.js (dbStrategy)
  │   │   ├── repositories/security.repository.js
  │   │   ├── services/authService.js
  │   │   │   ├── errors/ConflictError.js ──── errors/appErrors.js ──── config/system.js
  │   │   │   └── repositories/user.repository.js
  │   │   └── services/securityService.js
  │   │       └── repositories/security.repository.js
  │   ├── loadRoutes.js ──── routes/api/v1/**/*.js
  │   └── loadSwagger.js ──── swagger/components/index.js
  │       └── joi-to-swagger + mongoose-to-swagger
  ├── config/environment.js
  ├── config/security.js
  └── utils/logger.js

Middlewares:
  ├── middlewares/auth.js ──── security.repository.js (verifyJwt)
  ├── middlewares/authorize.js
  ├── middlewares/validation.js ──── utils/formatJoiErrors.js
  ├── middlewares/errorHandler.js ──── utils/logger.js
  ├── middlewares/perfMonitor.js
  └── utils/cookieParser.js
```
