# SASS Framework — Usage Guide

> **S**calable **A**rchitecture for **S**erver-side **S**ystems

A practical guide to adding new features, extending the framework, and following the established conventions.

---

## Table of Contents

1. [Adding a New Feature](#1-adding-a-new-feature)
2. [Creating a New Service](#2-creating-a-new-service)
3. [Creating a New Route](#3-creating-a-new-route)
4. [Creating a New Controller](#4-creating-a-new-controller)
5. [Creating a New Repository](#5-creating-a-new-repository)
6. [Creating a New Validation Schema](#6-creating-a-new-validation-schema)
7. [Applying Per-Route Rate Limiting](#7-applying-per-route-rate-limiting)
8. [Registering a Service in the Container](#8-registering-a-service-in-the-container)
9. [Adding a Custom Error](#9-adding-a-custom-error)
10. [Using the Logger](#10-using-the-logger)
11. [Working with Environment Variables](#11-working-with-environment-variables)
12. [Implementing a Strategy Backend](#12-implementing-a-strategy-backend)
13. [Authenticating Routes (JWT Middleware)](#13-authenticating-routes-jwt-middleware)
14. [Using the Route Auto-Loader](#14-using-the-route-auto-loader)
15. [Using the Model Auto-Loader](#15-using-the-model-auto-loader)
16. [Exposing an Endpoint in Swagger](#16-exposing-an-endpoint-in-swagger)
17. [Testing](#17-testing)
18. [Conventions Summary](#18-conventions-summary)

---

## 1. Adding a New Feature

Every feature follows this pipeline:

```
Route → Validation Middleware → Controller → Service → Repository → Model
```

**Example**: Adding a "get user profile" endpoint.

### Step 1 — Validation Schema (`src/validation/`)

```js
// src/validation/user/getProfile.js
const Joi = require('joi');

const GetProfileSchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

module.exports = GetProfileSchema;
```

### Step 2 — Repository Method (`src/repositories/`)

```js
// src/repositories/user.repository.js
class UserRepository {
  // ...existing methods...

  async findById(id) {
    return await User.findById(id);
  }
}
```

### Step 3 — Service Method (`src/services/`)

```js
// src/services/userService.js
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

### Step 4 — Controller (`src/controllers/`)

```js
// src/controllers/user.controller.js
const getProfile = async (req, res, next) => {
  try {
    const userService = req.getService('userService');
    const { userId } = req.validatedBody;
    const user = await userService.getProfile(userId);
    return res.status(200).json({
      success: true,
      traceId: req.id,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile };
```

### Step 5 — Route (`src/routes/v1/`)

Create a route definition file in the appropriate folder:

```js
// src/routes/v1/user/profile.js
const validateMiddleware = require('../../middlewares/validation');
const getProfileSchema = require('../../validation/user/getProfile');
const { getProfile } = require('../../controllers/user.controller');

module.exports = {
  method: 'post',
  path: '/profile',
  middleware: [validateMiddleware(getProfileSchema)],
  handler: getProfile,
};
```

### Step 6 — Done (auto-loader)

The loader picks it up automatically. `src/routes/v1/user/profile.js` → `POST /user/profile`. No manual registration needed.

### Step 7 — Register Service in Container

```js
// src/services/container.js
const UserService = require('./userService');
// ...after existing registrations...
const userService = new UserService({
  userRepository: container.get('userRepository') // after you register it
});
container.register('userService', userService);
```

---

## 2. Creating a New Service

Located in `src/services/`. A service encapsulates **business logic** and depends on repositories or other services via constructor injection.

```js
const ConflictError = require('../errors/ConflictError');

class PaymentService {
  constructor({ userRepository, billingRepository }) {
    this.userRepository = userRepository;
    this.billingRepository = billingRepository;
  }

  async processRefund(userId, amount) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return this.billingRepository.refund(userId, amount);
  }
}

module.exports = PaymentService;
```

**Rules:**
- Never import `req` or `res` — services are transport-agnostic
- Never call `new` on dependencies — receive them via constructor
- Use custom errors from `src/errors/` for business rule violations
- All public methods should be `async`

---

## 3. Creating a New Route

Located in `src/routes/v1/`. Each route file defines an Express router with middleware chains.

```js
const router = require('express').Router();
const validateMiddleware = require('../../middlewares/validation'); 
const mySchema = require('../../validation/myFeature/schema');
const { myHandler } = require('../../controllers/my.controller');

router.get('/resource', myHandler);
router.post('/resource', [validateMiddleware(mySchema)], myHandler);

module.exports = router;
```

No manual mounting — the `src/routes/v1/index.js` auto-loader picks up any `.js` file in `src/routes/v1/` by filename convention:

- `myRoutes.js` → mounted at `/my-routes`
- `user.js` → mounted at `/user`

For a custom mount path, export `{ router, path }`:
```js
module.exports = { router, path: '/custom-path' };
```

For non-versioned routes, add directly to `src/routes/index.js`:

```js
router.use('/webhook', webhookRoutes); // before the fallback
```

---

## 4. Creating a New Controller

Located in `src/controllers/`. Controllers handle **request/response** only — no business logic.

```js
const listAll = async (req, res, next) => {
  try {
    const service = req.getService('myService');
    const result = await service.listAll();
    return res.status(200).json({
      success: true,
      traceId: req.id,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAll };
```

**Conventions:**
- Get services via `req.getService('serviceName')`
- Read validated input from `req.validatedBody`
- Include `traceId: req.id` in every response
- Wrap in try/catch, pass errors to `next(err)`
- Never put business logic here

---

## 5. Creating a New Repository

Located in `src/repositories/`. Repositories abstract **data access** behind a clean interface.

```js
const User = require('../models/User');

class UserRepository {
  async findActive(limit = 10) {
    return await User.find({ active: true }).limit(limit);
  }

  async updateLastLogin(userId) {
    return await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }
}
```

**Rules:**
- Return plain data, never `req`/`res`
- Methods return Promises (async)
- Keep Mongoose-specific calls inside the repository only

---

## 6. Creating a New Validation Schema

Located in `src/validation/`. Group by feature in subdirectories.

```js
const Joi = require('joi');

const UpdateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  bio: Joi.string().trim().max(500).optional(),
  avatar: Joi.string().uri().optional()
});

module.exports = UpdateProfileSchema;
```

**Notes:**
- Use `.trim()` on all string fields
- Use `abortEarly: false` is set by the validation middleware, so all errors are collected
- Schemas auto-convert to Swagger via `joi-to-swagger`

---

## 7. Applying Per-Route Rate Limiting

Use the `createRateLimiter` factory in your route file:

```js
const createRateLimiter = require('../../middlewares/rateLimiter');

const strictLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5 });

router.post('/login', [strictLimiter, validate(loginSchema)], handler);
```

Available options:

| Option | Default | Description |
|---|---|---|
| `windowMs` | `60000` (1 min) | Time window in milliseconds |
| `max` | `10` | Max requests per window |
| `message` | `Too many requests...` | JSON error message |

---

## 8. Registering a Service in the Container

Edit `src/services/container.js`. Follow the existing registration order:

```js
// 1. Instantiate repositories first
const myRepo = new MyRepository();

// 2. Instantiate services with their dependencies
const myService = new MyService({
  myRepo: myRepo,
  otherService: container.get('otherService')
});

// 3. Register by name
container.register('myService', myService);
```

**Dependency order matters** — if Service A depends on Service B, register B first.

---

## 9. Adding a Custom Error

Create a new file in `src/errors/`:

```js
const AppError = require('./appErrors');

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

module.exports = ForbiddenError;
```

The `AppError` base class will automatically:
- Look up the default message from `HTTP_REQUESTS` (add your status code there too if needed)
- Set `status: 'fail'` for 4xx, `'error'` for 5xx
- Mark `isOperational = true` for the error handler

Then throw it from any service:

```js
throw new ForbiddenError('Only admins can delete resources');
```

---

## 10. Using the Logger

The Winston logger is at `src/utils/logger.js` and provides 5 levels:

```js
const logger = require('../utils/logger');

logger.error('Something broke', { stack: err.stack });
logger.warn('Rate limit approaching', { ip: req.ip });
logger.info('User registered', { userId: user.id });
logger.http('GET /health 200 5ms');
logger.debug('Query result', { rows: result.length });
```

**Log files** (in `storage/logs/`):

| File | Level |
|---|---|
| `error.log` | `error` only |
| `warning.log` | `warn` and above |
| `app.log` | `info` and above |

In development, the console shows all levels with colors. In production, only `warn`+ shows on console.

---

## 11. Working with Environment Variables

> **Note**: The next section (Implementing a Strategy Backend) is numbered 12 below.

### Adding a new env var

1. Add to all `.env.*` files with appropriate values:

```ini
# .env.development
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525

# .env.production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

2. Load it in `src/config/environment.js`:

```js
module.exports = {
  // ...existing config...
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
  }
};
```

3. Add to the production validation check if critical:

```js
if (envType === 'production') {
  const criticalKeys = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN', 'SMTP_HOST'];
  // ...
}
```

---

## 12. Implementing a Strategy Backend

Strategy files are in `src/strategies/`. Each domain has a directory with interchangeable implementations.

### Existing Strategies

| Directory | Implemented | Stub |
|---|---|---|
| `database/` | `mongo.strategy.js` — Full Mongoose wrapper (`create`, `findById`, `findOne`, `find`, `update`, `delete`, `count`) | `postgres.strategy.js` — Same interface, throws not-implemented |
| `storage/` | `localStorage.strategy.js` — Full filesystem storage (`upload`, `delete`, `getUrl`) | `s3Storage.strategy.js` — Same interface, throws not-implemented |

**How the database strategy works with repositories:**

```js
// src/repositories/user.repository.js
class UserRepository {
  constructor({ dbStrategy }) {
    this.dbStrategy = dbStrategy;  // injected by container
  }

  async findByEmail(email) {
    return this.dbStrategy.findOne('User', { email });
  }
}
```

The `dbStrategy` is resolved in `container.js` based on config:
```js
const dbStrategy = config.database.driver === 'postgres'
  ? new PostgresStrategy()
  : new MongoStrategy();
container.register('dbStrategy', dbStrategy);
```

### Adding a new strategy

**Example — Email strategy:**

```js
// src/strategies/email/smtp.strategy.js
class SmtpStrategy {
  async send(to, subject, body) {
    // Transporter-specific logic
  }
}
```

```js
// src/strategies/email/sendgrid.strategy.js
class SendGridStrategy {
  async send(to, subject, body) {
    // SendGrid-specific logic
  }
}
```

**Selection at registration:**

```js
// src/services/container.js
const EmailStrategy = config.email.provider === 'sendgrid'
  ? new SendGridStrategy()
  : new SmtpStrategy();
const emailService = new EmailService({ strategy: EmailStrategy });
container.register('emailService', emailService);
```

**Rules for implementing a strategy:**
- All implementations of the same domain must share the same method signatures
- Methods should be `async` and return Promises
- Configuration (connection strings, credentials) should come from `config` (environment variables), never hardcoded
- Store incoming configuration in `this.config` during construction

---

## 13. Authenticating Routes (JWT Middleware)

The `authenticate` middleware in `src/middlewares/auth.js` protects routes with JWT verification.

### How it works

```js
// Middleware checks for Authorization: Bearer <token>
// On success: attaches req.user = { id, email }
// On failure: passes UnauthorizedError to errorHandler
```

### Protecting a route

```js
// src/routes/v1/user.js
const router = require('express').Router();
const { authenticate } = require('../../middlewares/auth');
const { getProfile } = require('../../controllers/user.controller');

// Protect with auth
router.get('/profile', authenticate, getProfile);
```

### Accessing the authenticated user in a controller

```js
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    const userId = req.user.id;
    const userService = req.getService('userService');
    const user = await userService.getProfile(userId);
    return res.status(200).json({ success: true, traceId: req.id, data: user });
  } catch (err) {
    next(err);
  }
};
```

### Used in refresh token flow

The `POST /auth/refresh-token` endpoint does **not** require the `authenticate` middleware — it uses the `refreshToken` from the request body instead of a Bearer token. This allows clients to get a new token pair after the access token has expired.

---

## 14. Using the Route Auto-Loader

`src/routes/v1/loader.js` recursively scans `src/routes/v1/` and builds an Express router from folder-based route definition files.

### How it works

Each route file exports a config object:

```js
// src/routes/v1/user/profile.js
module.exports = {
  method: 'get',
  path: '/profile',
  middleware: [authenticate],
  handler: getProfile,
};
```

The loader recursively walks directories and registers every definition:
- `src/routes/v1/auth/login.js` → `POST /auth/login`
- `src/routes/v1/user/profile.js` → `GET /user/profile`

### Adding a new route group

Create a directory + file in `src/routes/v1/`:

```js
// src/routes/v1/payment/webhook.js
const stripeWebhook = require('../../../controllers/payment.controller').webhook;

module.exports = {
  method: 'post',
  path: '/webhook',
  handler: stripeWebhook,
};
```

This registers `POST /payment/webhook` — no manual wiring needed.

### For parameterized routes

```js
module.exports = {
  method: 'get',
  path: '/:id',
  middleware: [authenticate],
  handler: getUserById,
};
```

---

## 15. Using the Model Auto-Loader

`src/models/index.js` automatically discovers and registers all Mongoose models in `src/models/`.

### How it works

At startup (in `container.js`):
```js
require('../models/index');  // Auto-loads all models
```

This scans `src/models/` for `.js` files (excluding `index.js`) and `require()`s each one. Since each model file calls `mongoose.model('Name', schema)`, they're all registered globally before any repository uses them.

### Adding a new model

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

**No manual registration needed** — the auto-loader picks it up. Use it in any repository via `mongoose.model('Product')` or through the `dbStrategy`:

```js
// Inside a strategy
async findById(modelName, id) {
  return mongoose.model(modelName).findById(id);
}
```

---

## 16. Exposing an Endpoint in Swagger

Swagger docs are auto-generated from route files. Add a `docs` property to your route definition:

```js
// src/routes/v1/user/profile.js
module.exports = {
  method: 'get',
  path: '/profile',
  middleware: [authenticate],
  handler: getProfile,
  docs: {
    tags: ['Users'],
    summary: 'Get user profile',
    description: 'Returns the authenticated user profile.',
    responses: {
      200: {
        description: 'User profile returned successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                traceId: { type: 'string', example: '6e256651' },
                data: { $ref: '#/components/schemas/UserResponse' }
              }
            }
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
};
```

That's it — the swagger loader picks it up automatically. No manual imports in `swagger/index.js`.

### Manual path overrides (advanced)

For complex cases, pass `manualPaths` to `generatePaths` in `swagger/index.js`:

```js
const { generatePaths } = require('./loader');

const manualPaths = {
  '/legacy/endpoint': {
    get: { tags: ['Legacy'], summary: 'Old endpoint', responses: { 200: { description: 'OK' } } }
  }
};

module.exports = {
  // ...
  paths: generatePaths({ manualPaths }),
  // ...
};
```

### Schema references

For request/response schemas referenced in your `docs`:
- Define them in `src/routes/swagger/schemas/`
- Or auto-generate from Joi via `joi-to-swagger` in `src/routes/swagger/components/index.js`

---

## 17. Testing

Tests live in `src/tests/` and use Jest.

```js
// src/tests/auth.service.test.js
const AuthService = require('../services/authService');

describe('AuthService', () => {
  let authService;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { findByEmail: jest.fn(), create: jest.fn() };
    const mockSec = { hashPassword: jest.fn(() => 'hashed') };
    authService = new AuthService({
      userRepository: mockRepo,
      securityService: mockSec
    });
  });

  it('should throw ConflictError when email already exists', async () => {
    mockRepo.findByEmail.mockResolvedValue({ email: 'test@test.com' });
    await expect(authService.registerUser({ email: 'test@test.com' }))
      .rejects.toThrow('Email already registered');
  });
});
```

**Because of DI**, services are trivial to test — just inject mocks.

Run tests:

```bash
npm test                          # local
./command/test.sh                 # Docker
```

---

## 18. Conventions Summary

| Concern | Location | Responsibility |
|---|---|---|
| HTTP handling | `controllers/` | Parse request, call service, send response |
| Business logic | `services/` | Rules, orchestration, validation logic |
| Data access | `repositories/` | Database queries, ORM calls |
| Validation | `validation/` | Joi schema definitions |
| Cross-cutting | `middlewares/` | Tracing, DI injection, error handling |
| Error types | `errors/` | Typed operational errors |
| Configuration | `config/` | Environment loading, security setup |
| Swagger | `routes/swagger/` | OpenAPI spec generation |

**Golden rules:**
- Controllers never call `new` — use `req.getService()`
- Services never touch `req` or `res`
- Repositories never contain business logic
- Errors are always typed and thrown, never plain `new Error()`
- Every public method is documented with JSDoc
