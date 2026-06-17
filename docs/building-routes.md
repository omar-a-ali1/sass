# Building Routes — Junior vs Professional

## The Route File Contract

Every route is a file inside `src/routes/` that exports a single object:

```js
module.exports = {
  method: 'get',                  // http method (get, post, put, patch, delete)
  path: '/',                      // path relative to the directory (defaults to filename)
  middleware: [],                  // optional — Express middleware functions
  handler: async (req, res) => {}, // required — the request handler
  docs: {},                       // optional — Swagger/OpenAPI documentation
};
```

The **directory structure determines the URL**. A file at `routes/api/v1/auth/login.js` with `path: '/login'` becomes `POST /api/v1/auth/login`. File names are irrelevant — only the directory path and the `path` export matter.

---

## Junior Way — Quick & Dirty

Best for: prototypes, internal tools, one-off endpoints.

### Example: inline handler, no layers

```js
// src/routes/api/v1/echo.js
module.exports = {
  method: 'post',
  path: '/echo',
  handler: (req, res) => {
    res.json({
      message: 'You said: ' + (req.body.text || 'nothing'),
      headers: req.headers['content-type'],
    });
  },
};
```

**That's it** — drop the file, restart, and `POST /api/v1/echo` works. No controller, no service, no container.

### Example: with inline Mongoose query

```js
// src/routes/api/v1/ping-db.js
const mongoose = require('mongoose');

module.exports = {
  method: 'get',
  path: '/ping-db',
  handler: async (req, res) => {
    const state = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ database: state });
  },
};
```

### When to use the junior way

- You need a route **right now** for testing or debugging
- The handler is trivial (proxy, redirect, simple status)
- You are prototyping and don't know the final shape yet
- The code is < 10 lines and unlikely to grow

Later, when the route gains validation, error handling, or DB access, refactor it to the professional pattern.

---

## Professional Way — Full Framework Stack

Best for: production endpoints, complex business logic, team projects.

### Architecture chain

```
route file (src/routes/.../*.js)
  ├── middleware (validation, auth, rate limiting)
  └── controller (src/controllers/*.controller.js)
       └── service (src/services/*Service.js)
            └── repository (src/repositories/*.repository.js)
                 └── strategy (src/strategies/database/*.strategy.js)
```

Each layer has one responsibility and is independently testable.

### Step-by-step: building a `/products` endpoint

#### 1. Validation schema

```js
// src/validation/product/create.js
const Joi = require('joi');

module.exports = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().max(1000).optional(),
});
```

#### 2. Repository

```js
// src/repositories/product.repository.js
class ProductRepository {
  constructor({ dbStrategy }) {
    this.db = dbStrategy;
  }

  async create(data) {
    return this.db.create('Product', data);
  }

  async findById(id) {
    return this.db.findById('Product', id);
  }

  async paginate(query, opts) {
    return this.db.paginate('Product', query, opts);
  }
}

module.exports = ProductRepository;
```

The container auto-discovers this file and injects `dbStrategy`.

#### 3. Service

```js
// src/services/productService.js
const { NotFoundError } = require('../errors/appErrors');

class ProductService {
  constructor({ productRepository }) {
    this.repo = productRepository;
  }

  async create(data) {
    return this.repo.create(data);
  }

  async get(id) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);
    return product;
  }

  async list(query) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    return this.repo.paginate({}, { page, limit });
  }
}

module.exports = ProductService;
```

The container auto-discovers this file and injects `productRepository`.

#### 4. Controller

```js
// src/controllers/product.controller.js
const create = async (req, res, next) => {
  try {
    const svc = req.getService('productService');
    const data = await svc.create(req.validatedBody);
    return res.respond(data, 201);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    const svc = req.getService('productService');
    const data = await svc.get(req.params.id);
    return res.respond(data);
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const svc = req.getService('productService');
    const data = await svc.list(req.validatedQuery);
    return res.paginated(data);
  } catch (err) { next(err); }
};

module.exports = { create, get, list };
```

#### 5. Route files

Drop them in `src/routes/api/v1/products/`:

```js
// src/routes/api/v1/products/create.js
const validate = require('../../../../middlewares/validation');
const schema = require('../../../../validation/product/create');
const { create } = require('../../../../controllers/product.controller');

module.exports = {
  method: 'post',
  path: '/',
  middleware: [validate(schema)],
  handler: create,
  docs: {
    tags: ['Products'],
    summary: 'Create a new product',
    responses: {
      201: { description: 'Product created' },
      400: { $ref: '#/components/responses/ValidationError' },
    },
  },
};
```

```js
// src/routes/api/v1/products/get.js
const authenticate = require('../../../../middlewares/auth');
const { get } = require('../../../../controllers/product.controller');

module.exports = {
  method: 'get',
  path: '/:id',
  middleware: [authenticate],
  handler: get,
  docs: {
    tags: ['Products'],
    summary: 'Get product by ID',
    responses: {
      200: { description: 'Product found' },
      404: { $ref: '#/components/responses/NotFoundError' },
    },
  },
};
```

```js
// src/routes/api/v1/products/list.js
const { validateQuery } = require('../../../../middlewares/validation');
const querySchema = require('../../../../validation/product/list');
const { list } = require('../../../../controllers/product.controller');

module.exports = {
  method: 'get',
  path: '/',
  middleware: [validateQuery(querySchema)],
  handler: list,
  docs: {
    tags: ['Products'],
    summary: 'List products with pagination',
    responses: {
      200: { description: 'Paginated list' },
    },
  },
};
```

#### 6. Scaffold (shortcut)

```bash
npm run make:all Product
```

This generates the validation, model, repository, service, controller, and 5 CRUD route files automatically.

---

## Side-by-Side Comparison

| Concern | Junior | Professional |
|---|---|---|
| **Handler location** | Inline in the route file | `controller/` file via `req.getService()` |
| **Data access** | `mongoose.model('X').find()` | `repository → dbStrategy` |
| **Business logic** | Mixed with I/O | `service/` layer |
| **Validation** | Manual `if` statements | Joi schema + `validate()` middleware |
| **Error handling** | `res.status(500).json(...)` | Errors propagate to `errorHandler` |
| **Response format** | Any shape you write | `res.respond()` / `res.paginated()` |
| **DB engine switch** | Rewrite every query | Change config driver |
| **Testability** | Requires HTTP server | Mock the service/repository |
| **Swagger docs** | None | Auto-detected from middleware + `docs` |
| **Files to create** | 1 (route) | Up to 5 (validation, repo, service, controller, route) |

---

## When to Upgrade Junior → Professional

Ask yourself:

- **Will this grow beyond one use case?** → extract a service
- **Does it need validation?** → add Joi + `validate()`
- **Does it query a DB?** → create a repository
- **Does it return errors?** → use `AppError` subclasses
- **Does it need docs?** → fill out `docs` field

A common workflow: prototype the junior way, then in the same PR refactor to the professional stack before merging. The route file's `module.exports` contract never changes — only the handler implementation does.
