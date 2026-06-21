# Vibe Coding with SASS Framework

This guide helps AI agents (and humans) work with the SASS Framework consistently — like a senior developer who knows the codebase.

## Golden Rules

1. **Always follow the chain** — Route → Controller → Service → Repository → Strategy. Never skip layers.
2. **Use the scaffold** — `npm run make:all -- Name` before `npm run make:route -- Name`. Generate, then customize.
3. **Never hardcode dependencies** — services receive them via constructor injection. Let the container auto-discover.
4. **Sanitize output** — always strip `password` and `__v` with `sanitizeData()` before sending responses.
5. **Add Swagger docs** — every route needs a `docs` property for auto-generated OpenAPI.
6. **Wrap controllers in try/catch** — pass errors to `next(err)`, never catch silently.
7. **Tests must pass** — `npm test` before considering a task done.

## Vibe Coding Workflow

### New Feature

```bash
# 1. Scaffold the layers
npm run make:all -- Product

# 2. Generate CRUD routes
npm run make:route -- Product

# 3. Customize the generated files:
#    - Add fields to validation schemas (src/validation/product/*.js)
#    - Add fields to the model (src/models/Product.js)
#    - Add custom queries to the repository (src/repositories/product.repository.js)
#    - Add business logic to the service (src/services/productService.js)
#    - Wire up handlers in the controller (src/controllers/product.controller.js)
#    - Adjust route middleware and docs (src/routes/api/v1/product/*.js)

# 4. Restart and verify
npm run dev
npm run routes    # check the new routes are registered
```

### Quick Prototype (Junior Way)

```js
// src/routes/api/v1/echo.js
module.exports = {
  method: 'post',
  path: '/echo',
  handler: (req, res) => res.json({ echo: req.body }),
};
```

Refactor to the full chain before merging.

## Common Patterns

### Adding a new middleware to the pipeline

1. Create the middleware in `src/middlewares/`
2. Add it to `middlewareMap` in `src/bootstrap/index.js`
3. Add its key to `MIDDLEWARE_PIPELINE` in `src/config/system.js`

### Adding a new strategy backend

1. Implement the interface in `src/lib/strategies/<domain>/`
2. Register it in `src/bootstrap/loadContainer.js` with a config-driven driver map

### Cross-model joins

Use `db.join()` to query related data across collections/tables — works on both Mongo and Postgres:

```js
const result = await db.join('Order', [
  { with: 'User', local: 'userId', foreign: '_id', as: 'user' },
], { status: 'active' }, { page: 1, limit: 20 });
```

### Database transactions

Use `db.withTransaction()` for atomic multi-step operations — the callback receives a `trx` proxy:

```js
await db.withTransaction(async (trx) => {
  const account = await trx.forUpdate('Account', accountId);
  await trx.findByIdAndUpdate('Account', accountId, { balance: account.balance - 100 });
  await trx.create('Transaction', { from: accountId, amount: 100 });
});
```

All strategy methods called on `trx` automatically participate in the transaction.

### Row-level locking (Postgres only)

```js
await db.withTransaction(async (trx) => {
  const account = await trx.forUpdate('Account', accountId);   // single row
  const pending = await trx.forFind('Transaction', { status: 'pending' });  // multiple rows
});
```

### CSRF protection

CSRF is auto-enabled when `PROJECT_TYPE=cookies` or `PROJECT_TYPE=both`. The middleware uses the double-submit cookie pattern — no extra config needed. The frontend must read the `csrf-token` cookie and send it as the `X-CSRF-Token` header on state-changing requests.

### Response caching

Use the `cacheMiddleware()` factory to cache GET responses per-route:

```js
const cache = require('../../../middlewares/cache');

module.exports = {
  method: 'get',
  path: '/expensive-report',
  middleware: [cache({ ttl: 60 })],  // cache for 60 seconds
  handler: getReport,
};
```

Driver is config-driven via `CACHE_DRIVER` env var.

### Auto-sync on model change

Run `npm run cb-sync` alongside `npm run dev` — it watches `src/models/` and automatically syncs Postgres schema whenever a model file changes.

### Per-route rate limiting

Add a `rateLimit` property to your route definition — the framework auto-creates and prepends the middleware:

```js
module.exports = {
  method: 'post',
  path: '/login',
  rateLimit: { windowMs: 60000, max: 5 },
  middleware: [validate(loginSchema)],
  handler: login,
};
```

## What Not To Do

- ❌ Don't put business logic in controllers
- ❌ Don't call Mongoose directly in services — use the repository
- ❌ Don't use `res.status().json()` — use `res.respond()` / `res.paginated()` / `res.fail()`
- ❌ Don't create files manually when the scaffold exists — `npm run make:*` is faster and consistent
- ❌ Don't add new env vars to code without documenting in `.env.example`
- ❌ Don't commit `.env` files — only `.env.example` and `.env.test` should be tracked
