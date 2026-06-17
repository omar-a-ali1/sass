# SASS Framework — CLI Reference

> All commands and their expected usage, grouped by category.

---

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with `nodemon` (auto-restarts on file changes) |
| `npm start` | Start production server (`NODE_ENV=production`) |
| `npm test` | Run all 85 tests across 8 suites |

---

## Scaffolding (`npm run make:*`)

Generate files with the correct structure and container registration snippet printed at the end.

| Command | What it creates |
|---|---|
| `npm run make:all -- Product` | Everything below (controller, route, service, repository, validation, model) |
| `npm run make:controller -- Product` | `src/controllers/product.controller.js` |
| `npm run make:route -- Product` | `src/routes/api/v1/product.routes.js` |
| `npm run make:service -- Product` | `src/services/product.service.js` |
| `npm run make:repository -- Product` | `src/repositories/product.repository.js` |
| `npm run make:validation -- Product` | `src/validation/product.validation.js` |
| `npm run make:model -- Product` | `src/models/product.model.js` |
| `npm run make:seeder -- Product` | `src/seeders/product.seeder.js` |

All scaffolding skips existing files — safe to re-run.

---

## Routing

| Command | Description |
|---|---|
| `npm run routes` | List all registered routes with colour-coded HTTP methods, clickable `http://localhost:{PORT}` links, and middleware chain per route |

---

## Database Seeding

| Command | Description |
|---|---|
| `npm run seed` | Run all discovered seeders (`src/seeders/*.seeder.js`) |
| `npm run seed:clean` | Drop collections then reseed |
| `npm run seed -- --only User` | Run only the `User` seeder |

Seeder CLI refuses to run in `NODE_ENV=production`.

---

## Docker CLI

Predefined shell scripts in [`docker-cli/`](../docker-cli) for common Docker Compose workflows.

| Script | Command | What it does |
|---|---|---|
| `dev.sh` | `bash docker-cli/dev.sh` | Start dev app + MongoDB containers with live-reload |
| `test.sh` | `bash docker-cli/test.sh` | Start test app + MongoDB containers, run all tests |
| `seed.sh` | `bash docker-cli/seed.sh` | Run seeders inside the running dev container |

All scripts manage dependencies automatically via Docker Compose health checks (MongoDB must be healthy before the app starts).

### Docker Compose Services

Defined in [`docker-compose.yaml`](../docker-compose.yaml):

- **`app_dev`** — Dev server with hot-reload (port `5000`)
- **`app_test`** — Test runner (one-shot, exits when tests complete)
- **`mongodb_dev`** — Dev database (port `27017`, persistent volume)
- **`mongodb_test`** — Test database (port `27018`, isolated volume)

#### Quick Start with Docker

```bash
# Development
bash docker-cli/dev.sh

# Run tests
bash docker-cli/test.sh

# Seed database (in another terminal)
bash docker-cli/seed.sh
```

> **Note**: Docker Compose v2 (`docker compose`) is required. No manual `docker-compose` v1 support.
