# SASS Framework — Infrastructure & DevOps

---

## Dockerfile — Multi-Stage Build

**File**: `Dockerfile`

Base image: `node:22-alpine`

| Stage | Name | Purpose |
|---|---|---|
| 1 | `base` | Sets `WORKDIR /usr/src/app`, copies `package*.json` |
| 2 | `development` | Runs `npm install`, copies all source code |
| 3 | `builder` | Runs `npm ci --only=production` for lean production deps |
| 4 | `production` | Copies only `node_modules` (from builder), `server.js` and `src/` (from development). Creates `storage/logs` dir. Runs as `node` user. Exposes port 5000. Default CMD: `npm start`. |

---

## Docker Compose

**File**: `docker-compose.yaml`

Network: `sass_network` (bridge driver)

### Services

#### `mongodb_dev` — Development Database
| Property | Value |
|---|---|
| Image | `mongo:7.0` |
| Port | `27017:27017` |
| Volume | `mongo_dev_data:/data/db` |
| Healthcheck | `mongosh --eval "db.adminCommand('ping')"` (5s interval) |
| Restart | `unless-stopped` |

#### `mongodb_test` — Test Database
| Property | Value |
|---|---|
| Image | `mongo:7.0` |
| Port | `27018:27017` |
| Volume | `mongo_test_data:/data/db` |

#### `app_dev` — Development Application
| Property | Value |
|---|---|
| Build target | `development` |
| Env file | `.env.development` |
| Port | `5000:5000` |
| Volume | `.:/usr/src/app:z` (SELinux), `node_modules` excluded |
| Command | `npm run dev` |
| Depends on | `mongodb_dev` (healthy) |

#### `app_test` — Test Runner
| Property | Value |
|---|---|
| Build target | `development` |
| Env file | `.env.test` |
| Volumes | `.:/usr/src/app:z`, `node_modules` excluded |
| Depends on | `mongodb_test` |
| Command | `npm test` |

### Volumes

| Volume | Description |
|---|---|
| `mongo_dev_data` | Persists development MongoDB data |
| `mongo_test_data` | Persists test MongoDB data |

---

## Command Scripts

### `command/dev.sh`
```bash
docker compose up app_dev mongodb_dev
```
Starts development app + MongoDB stack.

### `command/test.sh`
```bash
docker compose up mongodb_test app_test
```
Starts test MongoDB + runs test suite.

---

## Environment Configuration

### File Loading Strategy

`config/environment.js` loads `.env.{NODE_ENV}` with `dotenv` using `override: true`.

| NODE_ENV | File Loaded |
|---|---|
| `development` | `.env.development` |
| `production` | `.env.production` |
| `test` | `.env.test` |
| (any other) | `.env.{value}` |

**Production validation**: If `NODE_ENV === 'production'`, the following env vars are required:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`

Missing any throws: `[CRITICAL CONFIG ERROR]: Missing environment variable [KEY] in production!`

### Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `ROUTE_PREFIX` | `/api/v1` | API route prefix (folder + mount point) |
| `PORT` | `3000` | HTTP server port |
| `BODY_LIMIT` | `1mb` | Maximum JSON request body size |
| `MONGO_URI` | `mongodb://localhost:27017/myapp_dev` | MongoDB connection string |
| `BCRPT_SALT_SIZE` | — | Bcrypt salt rounds |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `15m` | Access token expiry duration |
| `JWT_REFRESH_SECRET` | — | JWT refresh token secret |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | JWT refresh token expiry |
| `JWT_RESET_EXPIRES_IN` | `15m` | Reset-password token expiry |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `RATE_LIMIT_MAX` | `null` | Max requests per rate-limit window |
| `DB_DRIVER` | `mongo` | Database strategy driver (`mongo` or `postgres`) |
| `STORAGE_DRIVER` | `local` | Storage strategy driver (`local` or `s3`) |
| `STORAGE_LOCAL_PATH` | `storage/uploads` | Local filesystem upload directory |
| `STORAGE_LOCAL_URL` | `/uploads` | Public base URL for uploaded files |
| `S3_BUCKET` | — | AWS S3 bucket name |
| `S3_REGION` | — | AWS S3 region |
| `EMAIL_DRIVER` | `console` | Email strategy (`console` or `stub`) |
| `EMAIL_FROM` | `noreply@example.com` | Default from address for emails |

### Environment Files

| File | Key Overrides |
|---|---|
| `.env.development` | NODE_ENV=development, PORT=5000, dev DB URI |
| `.env.production` | NODE_ENV=production, production DB URI, strict secrets |
| `.env.test` | NODE_ENV=test, PORT=5001, test DB URI |

---

## Logging System

**File**: `src/utils/logger.js`

**Library**: Winston 3.x

### Log Levels

| Level | Priority | Color |
|---|---|---|
| `error` | 0 | red |
| `warn` | 1 | yellow |
| `info` | 2 | green |
| `http` | 3 | magenta |
| `debug` | 4 | white |

**Level function**: `'debug'` in development, `'warn'` otherwise.

### Transports

| Transport | Level | Destination |
|---|---|---|
| Console | All | stdout (colorized) |
| File | `error` | `storage/logs/error.log` |
| File | `info` | `storage/logs/app.log` |
| File | `warn` | `storage/logs/warning.log` |

### Log Format

```
[2026-06-17 13:00:00] development.INFO: Server running in [development] mode on port 5000 {}
```

Includes stack traces for errors, JSON metadata for additional context.

---

## Performance Metrics

**File**: `src/middlewares/perfMonitor.js`

Metrics are collected in-memory and exposed at `GET /health/metrics`:

```json
{
  "uptime": 3600,
  "requests": {
    "total": 1500,
    "byMethod": { "GET": 1000, "POST": 500 },
    "byRoute": {
      "/auth/login": { "count": 200, "avgMs": 45.5 },
      "/auth/register": { "count": 100, "avgMs": 120.3 }
    },
    "byStatus": { "2xx": 1400, "4xx": 95, "5xx": 5 },
    "avgResponseMs": 67.2
  },
  "histogram": { "5": 100, "10": 300, "25": 500, "50": 300, "100": 200, "250": 80, "500": 15, "1000": 3, "3000": 1, "5000": 1, "10000": 0 },
  "system": {
    "memory": { "rss": 123456789, "heapUsed": 65432100, "heapTotal": 100000000 },
    "loadAvg": [0.5, 0.3, 0.1],
    "cpuUser": 45000,
    "cpuSystem": 12000
  }
}
```

**Configuration** in `src/config/system.js`:
```js
PERF_MONITOR_CONFIG: {
  metricsEndpoint: true,   // Enable /health/metrics
  trackRoutes: true,       // Per-route breakdown
  histogramBuckets: [5, 10, 25, 50, 100, 250, 500, 1000, 3000, 5000, 10000]
}
```

---

## NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `cross-env NODE_ENV=development nodemon server.js` | Dev server with hot-reload |
| `npm start` | `cross-env NODE_ENV=production node server.js` | Production server |
| `npm test` | `cross-env NODE_ENV=test jest --runInBand --detectOpenHandles` | Run Jest tests |

---

## Jest Configuration

**Files**: `jest.config.js`, `jest.setup.js`

| Setting | Value |
|---|---|
| `testEnvironment` | `node` |
| Setup file | `jest.setup.js` (loads `.env.test` via dotenv) |

---

## Docker Ignore & Git Ignore

### `.dockerignore`
Excludes from Docker build context:
- `/docs`
- `/command`

**Note**: Should also exclude `.env*`, `.git`, `node_modules`, `README.md` for tighter security in the build context.

### `.gitignore`
Ignores:
- `*.env` files
- `/node_modules`
- `docs/` directory
- `/storage` directory

---

## System Configuration

`src/config/system.js` centralises framework-wide configuration:

| Key | Type | Purpose |
|---|---|---|
| `SECURITY_DEFAULTS` | `Object` | Rate-limit window/max, CORS methods/headers |
| `HTTP_REQUESTS` | `Object` | Status code → `{ status, message, log }` lookup |
| `MIDDLEWARE_PIPELINE` | `string[]` | Ordered middleware keys applied globally |
| `SWAGGER_CONFIG` | `Object` | OpenAPI `{ title, version, description }` |
| `PERF_MONITOR_CONFIG` | `Object` | `{ metricsEndpoint, trackRoutes, histogramBuckets }` |
