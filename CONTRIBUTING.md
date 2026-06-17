# Contributing to SASS Framework

## Getting Started

```bash
cp .env.example .env.development
npm install
npm run dev
```

## Project Structure

```
src/
  bootstrap/     Auto-loaders and Express app assembly
  config/        Environment and system config
  controllers/   HTTP request handlers
  errors/        Typed error classes
  middlewares/   Express middleware
  models/        Mongoose models
  repositories/  Data access layer
  routes/        Route definitions (directory → URL)
  services/      Business logic
  strategies/    Pluggable backends (DB, storage, email)
  utils/         Helpers (logger, sanitize)
  validation/    Joi schemas
cli/             Scaffold generator, route lister, seed runner
docs/            Documentation
```

## Adding a Feature

1. Create a validation schema in `src/validation/`
2. Create a route file in `src/routes/` (directory structure = URL)
3. Create a controller in `src/controllers/`
4. Create a service in `src/services/`
5. Create a repository in `src/repositories/`
6. The IoC container auto-discovers services and repositories

Or use the scaffold: `npm run make:all -- Product`

## Route Convention

Route files export `{ method, path, middleware, handler, docs }`. The directory hierarchy determines the URL:

```
routes/api/v1/products/create.js → POST /api/v1/products
```

File names are irrelevant — only the `path` export matters.

## Code Style

- `camelCase` for variables and functions, `PascalCase` for classes
- `async/await` for all asynchronous code
- Error handling via `try/catch` with `next(err)` in controllers
- Services receive dependencies via constructor injection (never `new`)
- Use `res.respond()`, `res.paginated()`, `res.fail()` for responses

## Testing

```bash
npm test
```

Tests use Jest with Supertest. The Mongoose module is mocked, so no database is needed.

## Committing

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Keep secrets out of commits — use `.env.example` for required env vars
