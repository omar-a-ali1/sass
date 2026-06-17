# Changelog

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
