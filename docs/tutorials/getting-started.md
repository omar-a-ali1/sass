# Getting Started

A step-by-step guide from cloning the repository to building your first production-ready route.

---

## 1. Clone

```bash
git clone git@github.com:omar-a-ali1/sass.git
cd sass
```

---

## 2. Setup

### Install dependencies

```bash
npm install
```

### Configure environment

Copy the example file and adjust as needed:

```bash
cp .env.development.example .env.development
```

The default `.env.development` works out of the box with Docker. For local (non-Docker) development, point to your local services:

```bash
# .env.development (local MongoDB)
DB_DRIVER=mongo
MONGO_URI=mongodb://localhost:27017/myapp_dev
POSTGRES_URI=postgres://localhost:5432/sass_dev  # if using PG locally
```

### Start the server

```bash
# Option A — with Docker (recommended)
bash docker-cli/dev.sh

# Option B — directly on host
npm run dev
```

Visit **http://localhost:5000/health** to confirm the server is running.

### View Swagger docs

Open **http://localhost:5000/api-docs** — auto-generated OpenAPI 3.0 from your route definitions. Available in development only.

### Run the tests

```bash
npm test
```

All 117 tests should pass across 12 suites.

---

## 3. Project Structure

```
sass/
├── server.js                        # Entry point (customisable)
├── src/
│   ├── app.js                       # Bootstrapped Express app
│   ├── bootstrap/
│   │   ├── index.js                 # Orchestrator — wires everything
│   │   ├── loadModels.js            # Auto-discovers models/
│   │   ├── loadContainer.js         # IoC container (strategies → repos → services)
│   │   ├── loadRoutes.js            # Auto-builds router from routes/
│   │   ├── loadSwagger.js           # Auto-generates OpenAPI
│   │   └── loadSeeders.js           # Runs seeders from seeders/
│   ├── config/
│   │   ├── environment.js           # .env loader (typed config)
│   │   ├── system.js                # Pipeline order, rate limits, Swagger meta
│   │   └── security.js              # CORS, helmet, rate limiter defaults
│   ├── models/                      # Mongoose schemas (auto-loaded)
│   │   ├── User.js
│   │   ├── Store.js
│   │   ├── ApiKey.js
│   │   └── ActivityLog.js
│   ├── routes/                      # Route definitions (auto-loaded)
│   │   ├── api/v1/                  # Directory = URL path
│   │   │   ├── auth/                #   Folder = Swagger tag
│   │   │   ├── users/
│   │   │   └── api-keys/
│   │   └── health/                  # Non-API routes
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middlewares/
│   ├── strategies/                  # Pluggable backends
│   │   ├── database/                #   MongoStrategy, PostgresStrategy
│   │   ├── storage/                 #   LocalStorageStrategy, S3StorageStrategy
│   │   └── email/                   #   ConsoleEmailStrategy, SmtpEmailStrategy
│   ├── validation/                  # Joi schemas
│   ├── errors/                      # AppError classes
│   ├── utils/                       # logger, sanitizeData, etc.
│   ├── seeders/                     # Auto-discovered seed files
│   └── tests/                       # Jest test suites
├── cli/                             # CLI tools
│   ├── make.js                      # Scaffolding generator
│   ├── list-routes.js               # Route lister
│   ├── list-models.js               # Model inspector
│   ├── fetch.js                     # DB query tool
│   ├── seed.js                      # Seeder runner
│   └── sync-db.js                   # PostgreSQL schema sync
├── docker-cli/                      # Docker workflow scripts
│   ├── dev.sh
│   ├── test.sh
│   ├── seed.sh
│   ├── models.sh
│   ├── fetch.sh
│   └── sync.sh
└── docker-compose.yaml
```

---

## 4. Libraries Used

| Library | Role |
|---|---|
| **express 5.x** | HTTP framework |
| **mongoose 9.x** | MongoDB ODM |
| **pg** | PostgreSQL client |
| **jsonwebtoken** | JWT signing / verification |
| **bcrypt** | Password / API key hashing |
| **joi** | Request validation |
| **joi-to-swagger** | Joi → OpenAPI schema |
| **mongoose-to-swagger** | Mongoose → OpenAPI schema |
| **swagger-ui-express** | Swagger UI at `/api-docs` |
| **dotenv** | Environment file loading |
| **cors** | Cross-origin support |
| **helmet** | Security headers |
| **express-rate-limit** | Rate limiting |
| **multer** | File upload handling |
| **nodemailer** | SMTP email sending |
| **socket.io** | WebSocket support |
| **cookie-parser** | Cookie parsing |
| **winston** | Structured logging |
| **morgan** | HTTP request logging |
| **serve-favicon** | Favicon serving |
| **jest** | Testing framework |
| **supertest** | HTTP assertion testing |
| **@faker-js/faker** | Fake data for seeders |

---

## 5. Base Features Included

### Authentication
- Register, login, refresh tokens, forgot/reset password, get profile
- JWT access + refresh token flow, Bearer + cookie fallback
- Role-based authorization middleware: `authorize('admin')`

### API Key Management
- Generate keys (`sass_a1b2...`), validate (bcrypt), revoke
- `apiKeyAuth` middleware for `X-API-Key` header
- `authorizeApiKey('perm')` for permission scoping
- Configurable prefix via `API_KEY_PREFIX` env var

### Database Strategies (pluggable)
- `MongoStrategy` — full CRUD, paginate, soft delete
- `PostgresStrategy` — full CRUD, paginate, soft delete
- Switch via `DB_DRIVER=mongo|postgres` — no code changes

### Storage Strategies
- `LocalStorageStrategy` — filesystem uploads
- `S3StorageStrategy` — AWS S3 uploads
- Switch via `STORAGE_DRIVER=local|s3`

### Email Strategies
- `ConsoleEmailStrategy` — logs to console (development)
- `SmtpEmailStrategy` — real SMTP via nodemailer (production)
- `StubEmailStrategy` — throws on use (testing)
- Switch via `EMAIL_DRIVER=console|smtp|stub`

### Auto-Discovery
- **Models**: Drop a file in `src/models/` → auto-loaded, auto-converted to OpenAPI
- **Routes**: Drop a file in `src/routes/` → directory hierarchy becomes URL path → live immediately
- **Swagger**: Joi schemas, path params, auth middleware all auto-detected and documented
- **Seeders**: Drop a `*.seeder.js` in `src/seeders/` → discoverable by `npm run seed`

### Response Envelope
- `res.respond(data, 201)` — success with data
- `res.paginated({ data, total, page, limit })` — paginated collections
- `res.fail(message, 400)` — error responses
- All include `traceId` for request tracing

### Performance & Observability
- Request tracing (`traceId` on every request)
- Performance monitoring (`/health/metrics` endpoint)
- Structured logging with Winston
- Activity log middleware (auto-records to `ActivityLog` collection)
- Configurable middleware pipeline order

### Soft Delete
- `dbStrategy.softDelete(model, id)` — sets `deletedAt`
- `dbStrategy.restore(model, id)` — clears `deletedAt`
- Non-destructive — existing queries unchanged

### CLI Toolkit
| Command | What it does |
|---|---|
| `npm run make:all -- Product` | Scaffold everything (model → route → controller → service → repository → validation) |
| `npm run make:controller -- Product` | Scaffold a controller |
| `npm run make:route -- Product` | Scaffold 5 route files (create, list, get, update, delete) |
| `npm run make:service -- Product` | Scaffold a service |
| `npm run make:repository -- Product` | Scaffold a repository |
| `npm run make:validation -- Product` | Scaffold a validation schema |
| `npm run make:model -- Product` | Scaffold a Mongoose model |
| `npm run routes` | List all registered routes with colours |
| `npm run models` | Show all models and column types |
| `npm run fetch -- User --limit 5` | Query records from the CLI |
| `npm run seed` | Run all seeders |
| `npm run sync` | Sync Mongoose models → PostgreSQL schema |

### Docker
- `bash docker-cli/dev.sh` — full dev environment (app + MongoDB + PostgreSQL)
- `bash docker-cli/test.sh` — run tests in Docker
- `bash docker-cli/seed.sh` — seed database in Docker
- `bash docker-cli/models.sh` — inspect models in Docker
- `bash docker-cli/fetch.sh User --limit 5` — query records in Docker
- `bash docker-cli/sync.sh` — sync PG schema in Docker
- All scripts handle health checks automatically

---

## 6. Build Your First Route

You'll build a **Products** feature with a `GET /api/v1/products` endpoint. Two approaches:

### Junior Way — Manual

Create each file by hand following the existing patterns.

#### 6a. Create the model

`src/models/Product.js`:

```js
const mongoose = require('mongoose');

const schema = mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'general' },
}, { timestamps: true });

module.exports = mongoose.model('Product', schema);
```

The model is auto-loaded at startup — no registration needed.

#### 6b. Create the route

`src/routes/api/v1/products/list.js`:

```js
const handler = async (req, res) => {
  const db = req.getService('dbStrategy');
  const Product = req.model('Product');
  const products = await db.find(Product);
  res.respond(products);
};

module.exports = {
  method: 'get',
  path: '/',
  handler,
  docs: {
    tags: ['Products'],
    summary: 'List all products',
  },
};
```

That's it — the route is live at `GET /api/v1/products` with auto-Swagger docs.

#### 6c. Test it

```bash
curl http://localhost:5000/api/v1/products
```

---

### Senior Way — CLI Scaffolding (Recommended)

The CLI generates the full stack with one command:

```bash
npm run make:all -- Product
```

This creates eight files:

| File | Path |
|---|---|
| Model | `src/models/Product.js` |
| Controller | `src/controllers/product.controller.js` |
| Service | `src/services/product.service.js` |
| Repository | `src/repositories/product.repository.js` |
| Validation | `src/validation/product.validation.js` |
| Route — Create | `src/routes/api/v1/products/create.js` |
| Route — List | `src/routes/api/v1/products/list.js` |
| Route — Get | `src/routes/api/v1/products/getProduct.js` |
| Route — Update | `src/routes/api/v1/products/update.js` |
| Route — Delete | `src/routes/api/v1/products/delete.js` |

The scaffolding skips existing files — safe to re-run.

#### Fill in the generated files

**`src/models/Product.js`** — define the schema:

```js
const mongoose = require('mongoose');

const schema = mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'general' },
}, { timestamps: true });

module.exports = mongoose.model('Product', schema);
```

**`src/repositories/product.repository.js`** — data access:

```js
class ProductRepository {
  constructor({ dbStrategy }) {
    this.db = dbStrategy;
  }

  async findAll() {
    return this.db.find('Product');
  }

  async findById(id) {
    return this.db.findById('Product', id);
  }

  async create(data) {
    return this.db.create('Product', data);
  }

  async update(id, data) {
    return this.db.update('Product', id, data);
  }

  async delete(id) {
    return this.db.delete('Product', id);
  }
}

module.exports = ProductRepository;
```

**`src/services/product.service.js`** — business logic:

```js
class ProductService {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async list() {
    return this.productRepository.findAll();
  }

  async get(id) {
    return this.productRepository.findById(id);
  }

  async create(data) {
    return this.productRepository.create(data);
  }

  async update(id, data) {
    return this.productRepository.update(id, data);
  }

  async delete(id) {
    return this.productRepository.delete(id);
  }
}

module.exports = ProductService;
```

**`src/controllers/product.controller.js`** — request/response handling:

```js
const list = async (req, res, next) => {
  try {
    const service = req.getService('productService');
    const products = await service.list();
    res.respond(products);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const service = req.getService('productService');
    const product = await service.create(req.validatedBody);
    res.respond(product, 201);
  } catch (err) { next(err); }
};

module.exports = { list, create };
// (get, update, delete follow the same pattern)
```

The IoC container auto-wires `ProductRepository` → `ProductService` → controller automatically — no manual registration.

#### Run the route lister to confirm

```bash
npm run routes
```

You'll see your new endpoints registered:

```
GET    http://localhost:5000/api/v1/products/
POST   http://localhost:5000/api/v1/products/
GET    http://localhost:5000/api/v1/products/:id
PUT    http://localhost:5000/api/v1/products/:id
DELETE http://localhost:5000/api/v1/products/:id
```

Swagger at `/api-docs` is updated automatically with request bodies, response schemas, and error codes.

> Response schemas with sensitive fields stripped are auto-generated as `{Model}Response` (e.g. `UserResponse` excludes `password`). Reference `#/components/schemas/UserResponse` in your route's Swagger docs.

---

## 7. See Auto-Features in Action

After scaffolding, these happen automatically:

| Feature | What happens automatically |
|---|---|
| **Model loaded** | `loadModels.js` picks up `Product.js` |
| **Container wired** | `loadContainer.js` scans `repositories/` and `services/`, resolves constructor deps, registers instances |
| **Routes live** | `loadRoutes.js` scans `routes/api/v1/products/`, builds the Express Router |
| **Swagger generated** | `loadSwagger.js` reads each route's `docs`, merges Joi schemas, detects `:id` params, auto-adds 400/401/403/500 error refs |
| **PostgreSQL schema** | `npm run sync` creates the `products` table with matching columns (safe — only additive) |
| **Seeds discoverable** | Drop a `product.seeder.js` in `seeders/` and `npm run seed` runs it |

---

## 8. Server Configuration

### Environment-based config

The framework loads `.env.{NODE_ENV}` — no hardcoded values:

```bash
.env.development    # npm run dev
.env.production     # npm start
.env.test           # npm test
```

Key configuration variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `DB_DRIVER` | `mongo` | `mongo` or `postgres` |
| `MONGO_URI` | `mongodb://localhost:27017/myapp_dev` | MongoDB connection |
| `POSTGRES_URI` | — | PostgreSQL connection |
| `JWT_SECRET` | — | JWT signing key (required in production) |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `EMAIL_DRIVER` | `console` | `console`, `smtp`, or `stub` |
| `API_KEY_PREFIX` | `sass` | Prefix for generated API keys |
| `RATE_LIMIT_MAX` | `null` | Global rate limit (requests per 15 min) |
| `STORAGE_DRIVER` | `local` | `local` or `s3` |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `BODY_LIMIT` | `1mb` | Max JSON body size |

### Middleware pipeline

The middleware order is configured in `src/config/system.js`:

```js
const MIDDLEWARE_PIPELINE = [
  'favicon',       # Serve favicon
  'helmet',        # Security headers
  'cors',          # Cross-origin
  'cookieParser',  # Cookie support
  'json',          # Body parsing
  'urlencoded',    # Form data
  'rateLimiter',   # Rate limiting
  'perfMonitor',   # Performance tracking
  'tracer',        # Request trace ID
  'injectServices',# Service injection on req
  'responder',     # res.respond/res.paginated/res.fail
  'activityLog',   # Auto-log requests
];
```

Reorder, remove, or add entries to customise the pipeline.

### Per-route rate limits

Declare `rateLimit` directly in your route definition — no central config needed:

```js
module.exports = {
  method: 'post',
  path: '/login',
  rateLimit: { max: 5, windowMs: 60 * 1000 },
  middleware: [validate(loginSchema)],
  handler: login,
};
```

### Contextual configuration

- Use **MongoDB** for prototyping (`DB_DRIVER=mongo`) — no schema migration needed
- Switch to **PostgreSQL** for production (`DB_DRIVER=postgres`) — same code, different driver
- Use **Docker** to avoid local installs — `bash docker-cli/dev.sh`
- Enable **SMTP email** by setting `EMAIL_DRIVER=smtp` with SMTP credentials
- Add **API key auth** by importing `apiKeyAuth` middleware to any route
- Use the **swagger abstraction** — only custom success bodies need documentation
- Reference **`#/components/schemas/UserResponse`** in route docs — it is auto-generated from the `User` model with `password` and other sensitive fields stripped
- Add **`rateLimit`** to any route definition to apply per-route rate limiting without touching global config
- Customise the **HTTP response envelope** by modifying the `responder` middleware
