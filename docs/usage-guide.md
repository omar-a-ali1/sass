# SASS Framework — Usage Guide

A practical guide to adding new features, extending the framework, and following the established conventions.

---

## Table of Contents

1. [Adding a New Feature](#1-adding-a-new-feature)
2. [Creating a Route](#2-creating-a-route)
3. [Dynamic Routes with Path Params](#3-dynamic-routes-with-path-params)
4. [Query Validation](#4-query-validation)
5. [Creating a Controller](#5-creating-a-controller)
6. [Creating a Service](#6-creating-a-service)
7. [Creating a Repository](#7-creating-a-repository)
8. [Creating a Validation Schema](#8-creating-a-validation-schema)
9. [Creating a New Model](#9-creating-a-new-model)
10. [Registering in the Container](#10-registering-in-the-container)
11. [Applying Per-Route Rate Limiting](#11-applying-per-route-rate-limiting)
12. [Authenticating Routes (JWT)](#12-authenticating-routes-jwt)
13. [Role-Based Authorization](#13-role-based-authorization)
14. [API Key Authentication](#14-api-key-authentication)
15. [Exposing in Swagger](#15-exposing-in-swagger)
16. [Implementing a Strategy Backend](#16-implementing-a-strategy-backend)
17. [Database Seeders](#17-database-seeders)
18. [Configuration Reference](#18-configuration-reference)
19. [Scaffold Generator (CLI)](#19-scaffold-generator-cli)
20. [Testing](#20-testing)
21. [Conventions Summary](#21-conventions-summary)

---

## 1. Adding a New Feature

Every feature follows this pipeline:

```
Route → Controller → Service → Repository → Model
                ↑
         Validation (body / query)
```

### Step 1 — Validation Schema (`src/validation/`)

```js
// src/validation/user/getProfile.js
const Joi = require('joi');
module.exports = Joi.object({
  userId: Joi.string().hex().length(24).required()
});
```

### Step 2 — Route File (`src/routes/api/v1/`)

```js
// src/routes/api/v1/user/profile.js
const { authenticate } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validation');
const getProfileSchema = require('../../../validation/user/getProfile');
const { getProfile } = require('../../../controllers/user.controller');

module.exports = {
  method: 'get',
  path: '/profile',
  middleware: [authenticate, validate(getProfileSchema)],
  handler: getProfile,
};
```

### Step 3 — Controller (`src/controllers/`)

```js
const getProfile = async (req, res, next) => {
  try {
    const userService = req.getService('userService');
    const { userId } = req.validatedBody;
    const user = await userService.getProfile(userId);
    return res.status(200).json({ success: true, traceId: req.id, data: user });
  } catch (err) { next(err); }
};
module.exports = { getProfile };
```

### Step 4 — Service + Repository (standard DI)

See sections below for details.

---

## 2. Creating a Route

Route files live under `src/routes/api/v1/{resource}/{action}.js`. Each file **must export**:

| Key | Required | Description |
|---|---|---|
| `method` | Yes | HTTP verb (`get`, `post`, `put`, `delete`, `patch`) |
| `path` | Yes | URL path relative to the directory |
| `middleware` | No | Array of Express middleware functions |
| `handler` | Yes | Route handler `(req, res, next)` |

**Example — simple route:**

```js
// src/routes/api/v1/ping/status.js
module.exports = {
  method: 'get',
  path: '/status',
  handler: (req, res) => res.json({ ok: true }),
};
```

This registers `GET /api/v1/ping/status` automatically — **zero manual wiring**.

### How the auto-loader maps paths

| File | Directory context | Export `path` | Registered route |
|---|---|---|---|
| `auth/login.js` | `auth/` | `/login` | `POST /api/v1/auth/login` |
| `users/getUser.js` | `users/` | `/:id` | `GET /api/v1/users/:id` |
| `users/listUsers.js` | `users/` | `/` | `GET /api/v1/users` |

The auto-loader scans `routes/` from the root — the directory hierarchy determines the URL path. A file at `routes/api/v1/auth/login.js` becomes `POST /api/v1/auth/login`.

---

## 3. Dynamic Routes with Path Params

Export `path: '/:id'` — the `:id` segment is automatically detected by Swagger and converted to an OpenAPI path parameter:

```js
// src/routes/api/v1/users/getUser.js
module.exports = {
  method: 'get',
  path: '/:id',
  middleware: [authenticate],
  handler: async (req, res) => {
    const user = await req.getService('userService').getProfile(req.params.id);
    res.json({ success: true, traceId: req.id, data: user });
  },
  docs: { summary: 'Get user by ID', tags: ['Users'] }
};
```

The Swagger auto-loader converts `:id` to `{id}` in the OpenAPI path key and generates a `parameters` array with `{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }`.

---

## 4. Query Validation

Use `validateQuery(joiSchema)` from `src/middlewares/validation.js`:

```js
// src/validation/users/list.js
const Joi = require('joi');
module.exports = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  sort:   Joi.string().valid('createdAt', '-createdAt').default('-createdAt'),
  search: Joi.string().allow('').optional(),
});
```

```js
// src/routes/api/v1/users/listUsers.js
const { authenticate } = require('../../../middlewares/auth');
const { validateQuery } = require('../../../middlewares/validation');
const listUsersQuery = require('../../../validation/users/list');

module.exports = {
  method: 'get',
  path: '/',
  middleware: [authenticate, validateQuery(listUsersQuery)],
  handler: async (req, res) => {
    const { page, limit, sort, search } = req.validatedQuery;
    // ...
    res.json({ success: true, traceId: req.id, data: results });
  },
  docs: { summary: 'List users', tags: ['Users'] }
};
```

**What happens automatically:**
- `req.query` is validated against the Joi schema with `allowUnknown: true` (extra params pass through)
- Cleaned values land in `req.validatedQuery`
- The Swagger auto-loader detects `_queryValidationSchema` on the middleware and generates OpenAPI `parameters` with `in: 'query'`

---

## 5. Creating a Controller

Located in `src/controllers/`. Controllers handle **request/response** only — no business logic. They follow the **Controller → Service → Repository → Strategy** chain.

```js
// src/controllers/user.controller.js
const getUser = async (req, res, next) => {
  try {
    const userService = req.getService('userService');
    const user = await userService.get(req.params.id);
    return res.respond(user);
  } catch (err) { next(err); }
};

const listUsers = async (req, res, next) => {
  try {
    const userService = req.getService('userService');
    const result = await userService.list(req.validatedQuery);
    return res.paginated(result);
  } catch (err) { next(err); }
};

module.exports = { getUser, listUsers };
```

**Conventions:**
- Get services via `req.getService('serviceName')`
- Read validated body from `req.validatedBody`, query from `req.validatedQuery`
- Use `res.respond(data, statusCode)`, `res.paginated(result)`, or `res.fail(message, statusCode)` for consistent response envelopes
- Wrap in try/catch, pass errors to `next(err)`
- Never put business logic here

---

## 6. Creating a Service

Located in `src/services/`. A service encapsulates **business logic** and depends on repositories or other services via constructor injection.

```js
const NotFoundError = require('../errors/NotFoundError');

class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

module.exports = UserService;
```

**Rules:**
- Never import `req` or `res` — services are transport-agnostic
- Never call `new` on dependencies — receive them via constructor
- Use custom errors from `src/errors/` for business rule violations
- All public methods should be `async`

---

## 7. Creating a Repository

Located in `src/repositories/`. Repositories abstract **data access** behind a clean interface.

```js
class UserRepository {
  constructor({ dbStrategy }) {
    this.dbStrategy = dbStrategy;
  }

  async findById(id) {
    return this.dbStrategy.findById('User', id);
  }

  async findByEmail(email) {
    return this.dbStrategy.findOne('User', { email });
  }
}
```

**Rules:**
- Use the injected `dbStrategy` — never call Mongoose directly
- Return plain data, never `req`/`res`
- Methods return Promises (async)

---

## 8. Creating a Validation Schema

Located in `src/validation/`. Group by feature in subdirectories.

```js
const Joi = require('joi');
const UpdateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  bio:  Joi.string().trim().max(500).optional(),
});
module.exports = UpdateProfileSchema;
```

**Notes:**
- Use `.trim()` on all string fields
- `abortEarly: false` is set by the middleware, so all errors are collected
- Schemas auto-convert to Swagger via `joi-to-swagger`

---

## 9. Creating a New Model

Simply create a new file in `src/models/`:

```js
// src/models/Product.js
const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  price: { type: Number, required: true },
});
module.exports = mongoose.model('Product', productSchema);
```

The bootstrap auto-loader (`loadModels.js`) picks it up automatically at startup and converts it to an OpenAPI schema via `mongoose-to-swagger`.

**PostgreSQL schema sync:** Use the sync tool to keep your database schema in line with your model definitions:

```bash
npm run sync                    # Sync all models
npm run sync User Store         # Sync specific models
bash docker-cli/sync.sh         # Sync all models (Docker)
```

The tool reads each Mongoose model definition, derives the column types, and applies only additive changes — never drops or alters existing columns. Existing data is always preserved. For MongoDB, Mongoose auto-creates collections and fields on first write, so no sync step is needed.

---

## 10. Registering in the Container

The container in `src/bootstrap/loadContainer.js` auto-discovers repositories and services. If you need to manually register a service with custom dependencies, the multi-pass resolver handles dependency ordering automatically.

```js
// 1. Strategies first (driver-based selection)
const dbStrategy = { mongo: MongoStrategy, postgres: PostgresStrategy }[config.database.driver];

// 2. Repositories
const userRepo = new UserRepository({ dbStrategy });

// 3. Services
const userService = new UserService({ userRepository: userRepo });

// 4. Register by name
container.register('dbStrategy', dbStrategy);
container.register('userRepository', userRepo);
container.register('userService', userService);
```

**Dependency order matters** — if Service A depends on Service B, register B first.

---

## 11. Applying Per-Route Rate Limiting

Use the `createRateLimiter` factory in your route file:

```js
const createRateLimiter = require('../../../middlewares/rateLimiter');
const strictLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5 });

// In route definition:
middleware: [strictLimiter, validate(loginSchema)],
```

Available options:

| Option | Default | Description |
|---|---|---|
| `windowMs` | `60000` (1 min) | Time window in milliseconds |
| `max` | `10` | Max requests per window |
| `message` | `Too many requests...` | JSON error message |

---

## 12. Authenticating Routes (JWT)

The `authenticate` middleware in `src/middlewares/auth.js` protects routes:

```js
const { authenticate } = require('../../../middlewares/auth');

// In route definition:
middleware: [authenticate],
```

**How it works:**
- Checks `Authorization: Bearer <token>` header, then falls back to the `token` cookie
- On success: sets `req.user = { id, email, role }`
- On failure: passes `UnauthorizedError` to error handler

**Swagger auto-detection:** Routes using `authenticate` automatically get `security: [{ bearerAuth: [] }, { cookieAuth: [] }]` in their OpenAPI spec.

**Accessing the user in a controller:**

```js
const userId = req.user.id;
const userRole = req.user.role;
```

---

## 13. Role-Based Authorization

Use the `authorize` middleware after `authenticate`:

```js
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/authorize');

// Single role:
middleware: [authenticate, authorize('admin')]

// Multiple roles:
middleware: [authenticate, authorize(['admin', 'moderator'])]
```

Returns `403 ForbiddenError` if the user's role is not in the allowed list.

---

## 14. API Key Authentication

Routes can be protected using API keys instead of JWT tokens. API keys are persisted as bcrypt hashes — the raw key is only visible once at creation.

### Managing API Keys

Authenticated users can create, list, and revoke API keys via the API:

```bash
# Create an API key (requires JWT auth)
curl -X POST http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My CLI Key","permissions":["read:users"]}'
# Returns: { apiKey: { ... }, rawKey: "sass_a1b2c3d4..." }

# List keys
curl http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer <jwt>"

# Revoke a key
curl -X DELETE http://localhost:5000/api/v1/api-keys/<id> \
  -H "Authorization: Bearer <jwt>"
```

### Using API Keys on Protected Routes

Pass the API key via the `X-API-Key` header:

```bash
# List users with an API key
curl http://localhost:5000/api/v1/users \
  -H "X-API-Key: sass_a1b2c3d4e5f6..."

# Pipe raw JSON through jq
curl -s http://localhost:5000/api/v1/users \
  -H "X-API-Key: sass_a1b2c3d4e5f6..." | jq '.data'
```

### Adding API Key Auth to a Route

```js
const apiKeyAuth = require('../../../middlewares/apiKeyAuth');

module.exports = {
  method: 'get',
  path: '/data',
  middleware: [apiKeyAuth],
  handler: myHandler,
};
```

On success, `req.apiKey` contains `{ id, name, permissions }` and `req.user` contains `{ id }`.

### Creating and Revoking Keys (CLI with curl)

```bash
# Create a key (requires JWT auth)
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl -X POST http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"dev-cli","permissions":["read:users"]}'

# Save the rawKey from the response — it is shown only once

# List existing keys
curl http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN"

# Revoke a key
curl -X DELETE http://localhost:5000/api/v1/api-keys/<key-id> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 15. Exposing in Swagger

Swagger docs are auto-generated from route files. Add a `docs` property:

```js
module.exports = {
  method: 'get',
  path: '/profile',
  middleware: [authenticate],
  handler: getProfile,
  docs: {
    tags: ['Users'],
    summary: 'Get user profile',
    responses: {
      200: { description: 'User profile returned', content: { 'application/json': { schema: { type: 'object' } } } },
      404: { $ref: '#/components/responses/NotFoundError' },
    }
  }
};
```

**Auto-detection features** (no manual `docs` needed for these):
- Joi body schema on middleware `_validationSchema` → generates `requestBody`
- Joi query schema on middleware `_queryValidationSchema` → generates `parameters`
- `authenticate` middleware → adds `security`
- `:id` in path → adds path `parameters`

### Auto-added response codes

Every route automatically gets these response codes — you do **not** need to declare them:

| Code | Added when |
|---|---|
| `400` ValidationError | **Always** — any endpoint can receive malformed input |
| `500` InternalServerError | **Always** — any endpoint can crash |
| `401` UnauthorizedError | Route uses `authenticate` middleware |
| `403` ForbiddenError | Route uses `authenticate` middleware |

Route files only need to declare:
- **Custom success body** — the auto-added success code only has a description, no content schema. Provide a full `content` block with your endpoint's data shape.
- **Extra error codes** — codes outside the auto-added set (`404`, `409`, `503`, etc.)

### Example — minimal route (all errors auto-added)

```js
// docs.responses only declares the custom success body
docs: {
  summary: 'Reset password',
  responses: {
    200: {
      description: 'Password reset successfully',
      content: { 'application/json': { schema: { ... } } },
    },
    // 400 and 500 auto-added — no need to write them
  },
}
```

### Example — route with extra error codes

```js
// auth/register.js
docs: {
  summary: 'Register a new account',
  responses: {
    201: { /* custom success body */ },
    409: { $ref: '#/components/responses/ConflictError' },  // extra — not auto-added
    // 400 and 500 auto-added
  },
}
```

### Example — auth route (401/403 auto-added)

```js
// auth/me.js — middleware: [authenticate]
docs: {
  summary: 'Get current user profile',
  responses: {
    200: { /* custom success body */ },
    404: { $ref: '#/components/responses/NotFoundError' },  // this endpoint can return 404
    // 400, 401, 403, 500 auto-added because authenticate is in the middleware chain
  },
}
```

The tag is derived from the immediate parent folder name. For example, a route at `routes/api/v1/auth/login.js` gets tag `Auth` (from the `auth/` folder). Tags can be overridden via `docs.tags` in the route definition.

---

## 16. Implementing a Strategy Backend

Strategy files are in `src/strategies/`. Each domain has interchangeable implementations.

### Existing Strategies

| Directory | Implemented | Also Available |
|---|---|---|
| `database/` | `mongo.strategy.js` — Full Mongoose wrapper | `postgres.strategy.js` — Full PG via lazy `pg.Pool` |
| `storage/` | `localStorage.strategy.js` — Full filesystem | `s3Storage.strategy.js` — Full S3 via lazy `@aws-sdk/client-s3` |
| `email/` | `consoleEmail.strategy.js` — Logs to console | `stubEmail.strategy.js` — Throws (placeholder) |

### Adding a new strategy

```js
// src/strategies/email/smtp.strategy.js
class SmtpStrategy {
  async send(to, subject, body) {
    // nodemailer logic here
  }
}
```

**Registration** (in `container.js`):

```js
const EmailStrategy = { console: ConsoleEmailStrategy, smtp: SmtpStrategy }[config.email.driver];
container.register('emailStrategy', new EmailStrategy());
```

**Rules:**
- All implementations of the same domain must share the same method signatures
- Methods should be `async` and return Promises
- Configuration comes from `config` (environment), never hardcoded

PostgresStrategy and S3StorageStrategy use **lazy `require()`** inside their methods so their optional dependencies (`pg`, `@aws-sdk/client-s3`) don't break imports when not installed.

---

## 17. Database Seeders

Seeders populate your development database with realistic test data using `@faker-js/faker`.

### CLI Commands

```bash
# Seed all models
npm run seed

# Drop existing data before seeding
npm run seed -- --clean

# Seed only a specific model
npm run seed -- --only user

# Scaffold a new seeder file
npm run make:seeder -- Product
```

### Seeder Definition Format

Create `src/seeders/<name>.seeder.js` exporting:

```js
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

module.exports = {
  model: 'User',             // Mongoose model name (required)
  count: 10,                 // Number of records to generate (default 10)
  generate(i) {              // Called per record with index
    return {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: bcrypt.hashSync('password123', 10),
      role: i === 0 ? 'admin' : 'user',
    };
  },
};
```

Files are auto-discovered by `src/bootstrap/loadSeeders.js` — no manual registration needed.

---



## 18. Configuration Reference

### Environment Variables

| Variable | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP server port |
| `BODY_LIMIT` | `1mb` | Max JSON request body size |
| `MONGO_URI` | `mongodb://localhost:27017/myapp_dev` | MongoDB connection string |
| `BCRPT_SALT_SIZE` | `12` | Bcrypt salt rounds |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_SECRET` | — | Refresh token secret |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `JWT_RESET_EXPIRES_IN` | `15m` | Reset-password token expiry |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `RATE_LIMIT_MAX` | `100` | Max requests per rate-limit window |
| `DB_DRIVER` | `mongo` | Database strategy (`mongo` or `postgres`) |
| `STORAGE_DRIVER` | `local` | Storage strategy (`local` or `s3`) |
| `EMAIL_DRIVER` | `console` | Email strategy (`console` or `stub`) |

### System Config (`src/config/system.js`)

| Key | Description |
|---|---|
| `MIDDLEWARE_PIPELINE` | Ordered array of middleware keys applied globally |
| `SWAGGER_CONFIG` | `{ title, version, description }` for OpenAPI info |
| `PERF_MONITOR_CONFIG` | `{ metricsEndpoint, trackRoutes, histogramBuckets }` |
| `SECURITY_DEFAULTS` | Rate-limit defaults, CORS methods/headers |
| `HTTP_REQUESTS` | Status code → `{ status, message, log }` lookup |

### Middleware Pipeline (default order)

```
favicon → helmet → cors → cookieParser → json → rateLimiter → perfMonitor → tracer → injectServices → routes → errorHandler
```

Edit `MIDDLEWARE_PIPELINE` in `src/config/system.js` to reorder or omit middleware. Add new keys by registering in `middlewareMap` in `src/bootstrap/index.js`.

---

## 19. Scaffold Generator (CLI)

The framework provides Laravel-style `make:*` commands to scaffold individual artifacts or full resources:

```bash
# Generate individual artifacts
npm run make:validation -- Product    # src/validation/product/{create,update,list}.js
npm run make:model -- Product         # src/models/Product.js
npm run make:repository -- Product    # src/repositories/product.repository.js
npm run make:service -- Product       # src/services/productService.js
npm run make:controller -- Product    # src/controllers/product.controller.js
npm run make:route -- Product         # src/routes/api/v1/product/{create,list,get,update,delete}.js

# Generate everything at once (prints container registration snippet)
npm run make:all -- Product
npm run generate -- Product           # alias for make:all
```

### What `make:all` creates

| Artifact | File(s) | Description |
|---|---|---|
| Validation | `src/validation/{name}/create.js` | Joi schema for create body |
| | `src/validation/{name}/update.js` | Joi schema for update body |
| | `src/validation/{name}/list.js` | Joi schema for list query params |
| Model | `src/models/{Pascal}.js` | Mongoose model |
| Repository | `src/repositories/{name}.repository.js` | Data access with CRUD methods |
| Service | `src/services/{name}Service.js` | Business logic layer |
| Controller | `src/controllers/{name}.controller.js` | HTTP handlers (list, get, create, update, delete) |

**Routes are not generated by `make:all`** — run `npm run make:route -- Product` separately if you need CRUD endpoints.

After generating, the container auto-discovers the new repository and service files. If you need to manually register additional dependencies, use `src/bootstrap/loadContainer.js`.

### Naming conventions

| Input | PascalCase | camelCase | kebab |
|---|---|---|---|
| `product` | `Product` | `product` | `product` |
| `blog-post` | `BlogPost` | `blogPost` | `blog-post` |
| `user_profile` | `UserProfile` | `userProfile` | `user-profile` |

---

## 20. Testing

Tests live in `src/tests/` and use Jest.

```bash
npm test                          # local (117 tests)
bash docker-cli/test.sh           # Docker
```

**Key test files:**

| File | Tests | What it covers |
|---|---|---|
| `auth.int.test.js` | 25 | Register, login, refresh, forgot/reset password, auth-me |
| `auth.middleware.test.js` | 10 | Authenticate + authorize middleware |
| `dynamic-routes.test.js` | 7 | Path params, query validation |
| `strategies.test.js` | 20 | Mongo, Postgres, LocalStorage, S3Storage |
| `apiKey.test.js` | 12 | API key generation, validation, revocation |
| `softDelete.strategy.test.js` | 4 | Soft delete strategy methods |
| `email.strategy.test.js` | 3 | Console, SMTP fallback, and stub email |
| `rateLimiter.test.js` | 8 | Rate limiter factory |
| `security.repository.test.js` | 10 | JWT sign/verify, bcrypt |
| `env.test.js` | 3 | Env loading |
| `init.test.js` | 3 | Bootstrap |
| Static analysis | 14 | Lint-style checks |

**Because of DI**, services are trivial to test — just inject mocks.

---

## 21. Conventions Summary

| Concern | Location | Responsibility |
|---|---|---|
| HTTP handling | `controllers/` | Parse request, call service, send response |
| Business logic | `services/` | Rules, orchestration, validation |
| Data access | `repositories/` | Database queries via injected strategy |
| Validation | `validation/` | Joi schema definitions |
| Cross-cutting | `middlewares/` | Auth, tracing, DI injection, error handling |
| Error types | `errors/` | Typed operational errors |
| Configuration | `config/` | Environment loading, system defaults |
| Swagger | `swagger/components/` | Security schemes, shared responses |
| Bootstrap | `bootstrap/` | Auto-loaders, Express app assembly |

**Golden rules:**
- Controllers never call `new` — use `req.getService()`
- Services never touch `req` or `res`
- Repositories never contain business logic
- Errors are always typed and thrown, never plain `new Error()`
- Route files export `{ method, path, middleware, handler }` — no manual registration
- Every public method has JSDoc
