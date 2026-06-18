# SASS Framework — GitHub Copilot Instructions

## Project Context
Node.js + Express mini-framework with DI container, strategy pattern (Mongo/Postgres/S3), JWT auth, auto-discovery.

## Architecture Chain
route file → controller → service → repository → strategy

## Key Conventions
- Routes: `src/routes/` exports `{ method, path, middleware, handler, docs }`. Directory = URL prefix.
- Controllers: `req.getService()` + `res.respond()/paginated()/fail()`. try/catch → next(err).
- Services: constructor DI, typed errors, never import req/res.
- Repositories: data access via `dbStrategy`, never Mongoose directly.
- Validation: Joi schemas in `src/validation/`, applied via `validate()` / `validateQuery()` middleware.
- Sanitize: `sanitizeData(doc)` strips password/__v. `arr.map(sanitizeData(['field']))` for collections.

## Scaffold
```bash
npm run make:all -- Product
npm run make:route -- Product
```

## Testing
`npm test` — 85+ tests, Jest + Supertest, no MongoDB needed.

## Anti-patterns
- No business logic in controllers
- No direct Mongoose in services
- No `res.status().json()` — always use envelope helpers
- No manual file creation when scaffold exists
