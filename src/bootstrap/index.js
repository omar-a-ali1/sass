/**
 * Application Bootstrap
 *
 * Central orchestrator that wires the entire framework:
 *  1. Loads environment config
 *  2. Auto-loads Mongoose models
 *  3. Initialises the IoC container (strategies → repos → services)
 *  4. Auto-builds the v1 router from route definition files
 *  5. Auto-generates OpenAPI/Swagger documentation from Joi schemas
 *  6. Creates the Express app with global middleware
 *  7. Mounts routes and error handler
 *
 * @module bootstrap/index
 */

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const config = require('../config/environment');
const { helmetConfig, corsOptions, rateLimiter } = require('../config/security');
const logger = require('../utils/logger');

/** 1. Auto-load Mongoose models */
require('./loadModels');

/** 2. Initialize IoC container (strategies, repos, services) */
const container = require('../services/container');

/** 3. Build  router from auto-scanned route files */
const { Router } = require('./loadRoutes');

/** 4. Generate Swagger paths from route definitions */
const { generatePaths } = require('./loadSwagger');
const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'SaaS Framework Custom Engine Architecture',
    version: '1.0.0',
    description: 'Fully automated Open-API documentation layer compiled using centralized Joi Schemas.',
  },
  servers: [{ url: '/api', description: 'Local Development Server' }],
  paths: generatePaths(),
  components: require('../routes/swagger/components'),
};

/** 5. Create Express app with middleware pipeline */
const app = express();

app.use(favicon(path.join(__dirname, '..', '..', 'assets', 'favicon.ico')));
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimiter);
app.use(require('../middlewares/tracer'));
app.use(require('../middlewares/injectServices'));

/** 6. Mount routes */
const healthRoutes = require('../routes/health');
const fallback = require('../routes/defaults/fallback');

app.get('/', (req, res) => res.json({ message: 'SASS work !' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use('/health', healthRoutes);
app.use('/api', Router);
app.use(fallback);

/** 7. Global error handler */
app.use(require('../middlewares/errorHandler'));

module.exports = { app, container, config, swaggerDoc };
