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

## Professional Way — CLI Scaffolding

Best for: production endpoints, complex business logic, team projects.

The framework ships with a Laravel-style scaffold generator. One command generates all the layers — you just fill in the business logic.

### Architecture chain

```
route file (src/routes/.../*.js)          ← npm run make:route
  ├── middleware (validation, auth, rate limiting)
  └── controller (src/controllers/)       ← npm run make:controller
       └── service (src/services/)        ← npm run make:service
            └── repository (src/repositories/)   ← npm run make:repository
                 └── strategy (src/strategies/)
```

Each layer is auto-discovered by the IoC container — zero manual wiring.

### One-command: `make:all`

```bash
npm run make:all -- Product
```

This creates everything except routes:

| Artifact | File | What it gives you |
|---|---|---|
| Validation | `src/validation/product/{create,update,list}.js` | Joi schemas for body + query |
| Model | `src/models/Product.js` | Mongoose schema |
| Repository | `src/repositories/product.repository.js` | CRUD methods via `dbStrategy` |
| Service | `src/services/productService.js` | Business logic layer with DI |
| Controller | `src/controllers/product.controller.js` | `list`, `get`, `create`, `update`, `destroy` handlers |

Then generate the route files:

```bash
npm run make:route -- Product
```

This creates 5 route files at `src/routes/api/v1/product/`:

| File | Method | Path | Auth |
|---|---|---|---|
| `create.js` | `POST` | `/` | Validation |
| `list.js` | `GET` | `/` | Query validation |
| `get.js` | `GET` | `/:id` | `authenticate` |
| `update.js` | `PUT` | `/:id` | `authenticate` + Validation |
| `delete.js` | `DELETE` | `/:id` | `authenticate` |

**That's it.** Restart the server — `GET /api/v1/products`, `POST /api/v1/products`, etc. are live with Swagger docs, validation, and error handling.

### What the scaffold produces

Each generated file is a ready-to-use template. Here's what they look like:

#### Validation schema (`src/validation/product/create.js`)

```js
const Joi = require('joi');
module.exports = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
});
```

#### Repository (`src/repositories/product.repository.js`)

```js
class ProductRepository {
  constructor({ dbStrategy }) { this.db = dbStrategy; }
  async create(data)         { return this.db.create('Product', data); }
  async findById(id)         { return this.db.findById('Product', id); }
  async paginate(query, opts){ return this.db.paginate('Product', query, opts); }
}
module.exports = ProductRepository;
```

The container auto-injects `dbStrategy`.

#### Service (`src/services/productService.js`)

```js
class ProductService {
  constructor({ productRepository }) { this.repo = productRepository; }
  async create(data) { return this.repo.create(data); }
  async get(id) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError(\`Product \${id} not found\`);
    return product;
  }
  async list(query) { /* pagination logic */ }
}
module.exports = ProductService;
```

The container auto-injects `productRepository`.

#### Controller (`src/controllers/product.controller.js`)

```js
const list = async (req, res, next) => {
  try {
    const svc = req.getService('productService');
    const data = await svc.list(req.validatedQuery);
    return res.paginated(data);
  } catch (err) { next(err); }
};
// + get, create, update, destroy with the same pattern
module.exports = { list, get, create, update, destroy };
```

#### Route file (`src/routes/api/v1/product/create.js`)

```js
const validate = require('../../../../middlewares/validation');
const schema = require('../../../../validation/product/create');
const { create } = require('../../../../controllers/product.controller');

module.exports = {
  method: 'post',
  path: '/',
  middleware: [validate(schema)],
  handler: create,
  docs: {
    tags: ['Product'],
    summary: 'Create a new product',
    responses: { 201: { description: 'Product created' } },
  },
};
```

### Customizing the scaffold

The generated files are templates — edit them to add real business logic:

- **Validation**: add your fields to the Joi schema
- **Service**: add business rules, error throwing, orchestration
- **Repository**: add custom queries (e.g. `findByPriceRange`)
- **Route**: adjust middleware, add per-route rate limiting, expand Swagger docs
- **Model**: add fields, indexes, virtuals

### Individual commands

Build incrementally — use only what you need:

```bash
npm run make:validation -- Product    # src/validation/product/{create,update,list}.js
npm run make:model -- Product         # src/models/Product.js
npm run make:repository -- Product    # src/repositories/product.repository.js
npm run make:service -- Product       # src/services/productService.js
npm run make:controller -- Product    # src/controllers/product.controller.js
npm run make:route -- Product         # src/routes/api/v1/product/{create,list,get,update,delete}.js
```

All commands are safe to re-run — they skip existing files.

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
| **Files to create** | 1 (route file) | 0 — `npm run make:all -- Product` generates them |
| **CLI needed** | None | `npm run make:all` + `npm run make:route` |

---

## When to Upgrade Junior → Professional

Ask yourself:

- **Will this grow beyond one use case?** → extract a service
- **Does it need validation?** → add Joi + `validate()`
- **Does it query a DB?** → create a repository
- **Does it return errors?** → use `AppError` subclasses
- **Does it need docs?** → fill out `docs` field

A common workflow: prototype the junior way, then in the same PR refactor to the professional stack before merging. Run `npm run make:all` to scaffold the layers, then move your logic from the inline handler into the service/controller. The route file's `module.exports` contract never changes — only the handler implementation does.
