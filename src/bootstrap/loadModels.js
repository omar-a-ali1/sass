/**
 * Model Auto-Loader
 *
 * Scans `src/models/` and registers every Mongoose model.
 * Also auto-generates OpenAPI schemas from each model via `mongoose-to-swagger`.
 *
 * @module bootstrap/loadModels
 */

const fs = require('fs');
const path = require('path');
const m2s = require('mongoose-to-swagger');

const modelsDir = path.join(__dirname, '..', 'models');

const models = {};
const modelSchemas = {};

fs.readdirSync(modelsDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const filePath = path.join(modelsDir, file);
    const mod = require(filePath);
    if (mod && mod.modelName) {
      models[mod.modelName] = mod;
      modelSchemas[mod.modelName] = m2s(mod);
    }
  });

module.exports = { models, modelSchemas };
