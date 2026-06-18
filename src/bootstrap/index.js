/**
 * Application Bootstrap
 *
 * Central orchestrator that wires the entire framework:
 *  1. Loads environment config
 *  2. Auto-loads Mongoose models
 *  3. Initialises the IoC container (strategies → repos → services)
 *  4. Auto-builds the API router from route definition files
 *  5. Auto-generates OpenAPI/Swagger documentation from Joi schemas
 *  6. Creates the Express app with configurable middleware pipeline
 *  7. Mounts routes and error handler
 *
 * @module bootstrap/index
 */

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cors = require('cors');
const helmet = require('helmet');

const config = require('../config/environment');
const { SWAGGER_CONFIG, MIDDLEWARE_PIPELINE } = require('../config/system');
const { helmetConfig, corsOptions, rateLimiter } = require('../config/security');
const logger = require('../lib/utils/logger');

/** 1. Auto-load Mongoose models */
require('./loadModels');

/** 2. Initialize IoC container (strategies, repos, services) */
const container = require('./loadContainer');

/** 3. Build API router from auto-scanned route files */
const { Router } = require('./loadRoutes');

/** 4. Generate Swagger paths from route definitions (non-production only) */
let swaggerDoc = null;
let serveSwaggerUi = null;
let setupSwaggerUi = null;

if (config.env !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const { generatePaths } = require('./loadSwagger');

  swaggerDoc = {
    openapi: '3.0.0',
    info: { ...SWAGGER_CONFIG },
    servers: [{
      url: config.routePrefix || '/',
      description: 'Local Development Server'
    }],
    paths: generatePaths(),
    components: require('../lib/swagger/components'),
  };

  serveSwaggerUi = swaggerUi.serve;
  setupSwaggerUi = swaggerUi.setup(swaggerDoc);
}

/** 5. Create Express app with configurable middleware pipeline */
const app = express();
app.container = container;

/** Middleware lookup: maps pipeline keys to Express middleware */
const middlewareMap = {
  favicon: favicon(path.join(__dirname, '..', 'lib', 'assets', 'favicon.ico')),
  helmet: helmetConfig,
  cors: cors(corsOptions),
  cookieParser: require('cookie-parser')(),
  json: express.json({ limit: config.bodyLimit }),
  urlencoded: express.urlencoded({ extended: true, limit: config.bodyLimit }),
  rateLimiter,
  perfMonitor: require('../middlewares/perfMonitor').perfMonitor,
  tracer: require('../middlewares/tracer'),
  injectServices: require('../middlewares/injectServices'),
  responder: require('../middlewares/responder'),
  activityLog: require('../middlewares/activityLog'),
};

/** Apply middleware in the order defined by config */
for (const key of MIDDLEWARE_PIPELINE) {
  const mw = middlewareMap[key];
  if (mw) app.use(mw);
}

if (serveSwaggerUi && setupSwaggerUi) {
  app.use('/api-docs', serveSwaggerUi, setupSwaggerUi);
}
app.use(Router);
app.use(require('../middlewares/fallback'));

/** 7. Global error handler */
app.use(require('../middlewares/errorHandler'));

module.exports = { app, container, config, swaggerDoc };
