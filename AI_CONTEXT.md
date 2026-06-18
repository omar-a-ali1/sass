# SASS Framework — AI Context

You're working on the **SASS Framework**, a Node.js + Express mini-framework.

## Architecture (always follow this chain)

```
route file → controller → service → repository → strategy
```

Never skip layers. Controllers never have business logic. Services never touch req/res.

## Quick Facts

| Aspect | Rule |
|---|---|
| Routes | `src/routes/` — directory hierarchy = URL. Export `{ method, path, middleware, handler, docs }` |
| Scaffold | `npm run make:all -- Name` then `npm run make:route -- Name` |
| Controller | `req.getService('xxxService')` → `res.respond(data)` / `res.paginated(result)` / `res.fail(msg)`. Wrap in try/catch → `next(err)` |
| Service | Constructor DI: `constructor({ repo })`. Typed errors from `src/lib/errors/`. Never import req/res. |
| Repository | `dbStrategy.create/find/paginate` — never Mongoose directly |
| Validation | Joi schemas in `src/validation/`. Via `validate()` / `validateQuery()` middleware. Auto-documented in Swagger. |
| Sanitize | `sanitizeData(doc, ['field'])` to strip password/__v. `docs.map(sanitizeData(['field']))` for collections. |
| Errors | AppError subclasses (NotFoundError, ConflictError, UnauthorizedError, ValidationError, ForbiddenError) |
| Response | `res.respond(data, 200)`, `res.paginated(result)`, `res.fail(message, 400)` |
| Tests | `npm test` — Jest + Supertest. Mongoose is mocked, no DB needed. Pass before finishing. |
| Docker CLI | `bash src/tools/docker-cli/{dev,test,seed}.sh` or `npm run docker:*` |

## Commands

```bash
npm run make:all -- Product       # validation + model + repo + service + controller
npm run make:route -- Product     # 5 CRUD route files
npm run make:seeder -- Product    # Faker-based seeder
npm run routes                    # list all registered routes
npm run seed                      # seed database
npm test                          # run all tests
npm run dev                       # start dev server
```

## Anti-Patterns

- ❌ Don't put business logic in controllers
- ❌ Don't call Mongoose directly in services — use repository + dbStrategy
- ❌ Don't use `res.status().json()` — use `res.respond/paginated/fail`
- ❌ Don't create files manually when `npm run make:*` exists
- ❌ Don't commit `.env` files (only `.env.example` and `.env.test` are tracked)
