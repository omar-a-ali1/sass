---
name: sass-framework
description: Use ONLY when the task involves working with the SASS Framework codebase — building routes, adding features, fixing bugs, or refactoring. Covers architecture conventions, DI container, auto-discovery, scaffolding, and testing patterns.
---

# SASS Framework Development

## Project Structure

```
src/
  bootstrap/     Auto-loaders (routes, models, Swagger, container)
  config/        Environment + system config
  controllers/   HTTP handlers (thin — delegate to services)
  errors/        Typed error classes (AppError subclasses)
  middlewares/   Auth, validation, rate limiter, responder, upload
  models/        Mongoose schemas
  repositories/  Data access via dbStrategy
  routes/        Route definitions (directory = URL prefix)
  services/      Business logic with DI
  strategies/    Pluggable backends (mongo, postgres, s3, localStorage, email)
  utils/         Helpers (logger, sanitizeData)
  validation/    Joi schemas
cli/             Scaffold generator, route lister, seed runner
```

## Route Auto-Discovery

Files in `src/routes/` export `{ method, path, middleware, handler, docs }`. Directory hierarchy maps to URLs:

```
routes/api/v1/products/create.js  →  POST /api/v1/products
routes/health/index.js            →  GET  /health/
```

The `path` field in the export is relative to the directory. File names are irrelevant.

## Scaffold Commands

```bash
npm run make:all -- Product      # validation + model + repo + service + controller
npm run make:route -- Product    # 5 CRUD route files (create, list, get, update, delete)
npm run make:seeder -- Product   # Faker-based seeder
```

## Response Envelope

Controllers use `res.respond()`, `res.paginated()`, `res.fail()` — all auto-injected by the responder middleware.

## Data Sanitization

`sanitizeData(doc, extraFields)` strips `password` and `__v`. Two modes:

```js
sanitizeData(user)                    // single doc, defaults only
sanitizeData(user, ['token'])          // single doc with extra fields
users.map(sanitizeData(['token']))     // collection via mapper
users.map(sanitizeData)                // collection, defaults only
```

## Error Handling

All errors are typed subclasses of `AppError` in `src/errors/`. Throw in services, caught by `errorHandler`.

## Testing

- `npm test` — 85+ tests, Jest + Supertest
- Mongoose is mocked — no MongoDB required
- Tests live in `src/tests/`
