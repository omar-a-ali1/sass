# Changelog

## [1.1.0] — 2026-06-18

### Added

- `npm run models` — CLI to list models, their tables, and column types (PostgreSQL) or schema fields (MongoDB)
- `npm run fetch` — CLI to query database records by model with `--id`, `--where`, `--limit`, `--sort`, `--raw`
- `docker-cli/fetch.sh`, `docker-cli/models.sh` — Docker entry points for new CLI tools
- `ServiceUnavailableError` Swagger response component
- Automatic `400`/`500` response codes on every route, `401`/`403` on auth routes — routes no longer need to declare them
- `pickSuccessDefault()` reads route's declared `2xx` code so POST routes returning `200` (e.g. `forgot-password`) get the correct success code in Swagger
- `truncate()` and `insertMany()` on both `MongoStrategy` and `PostgresStrategy`

### Fixed

- **PostgreSQL seeding** — `loadSeeders.js` and `cli/seed.js` now driver-aware: use `PostgresStrategy.truncate()` + `insertMany()` when DB driver is postgres, instead of Mongoose (which timed out)

### Changed

- **Swagger response abstraction** — `loadSwagger.js` rewritten: `pickApplicableDefaults` → `pickSuccessDefault()` + `applyStandardErrorRefs()`. Error `$ref`s applied after user merge, not before
- All route files trimmed — redundant `400`/`500`/`401`/`403` refs removed from `docs.responses`
- `responses.js` now exports `ServiceUnavailableError` (fixes broken `$ref` in health route)
- `fetch.js` table output: passwords masked, JSON objects serialized, long strings truncated, dates formatted

## [1.0.0] — 2026-06-17

### Added

- Initial release
- JWT auth (register, login, refresh, forgot/reset password, profile)
- Bearer + cookie auth middleware with role-based authorization
- IoC container with auto-discovery (services, repositories)
- Strategy pattern (MongoDB, PostgreSQL, LocalStorage, S3, Email)
- Auto-route loading — directory hierarchy maps to URL paths
- Folder-based Swagger tag derivation
- Auto-Swagger generation from Joi schemas
- Query validation with auto-documented Swagger params
- Configurable middleware pipeline
- CLI scaffolding (`npm run make:*`)
- Route lister (`npm run routes`)
- Seeder system with Faker
- File upload middleware (Multer → storage strategy)
- Performance monitoring (`/health/metrics`)
- Response envelope (`res.respond`, `res.paginated`, `res.fail`)
- Docker multi-stage build + Compose
- 85 integration tests across 8 suites
