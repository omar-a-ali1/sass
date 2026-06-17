/**
 * Model Auto-Loader
 *
 * Scans `src/models/` and registers every Mongoose model.
 * Exports the loaded model objects for use by other modules
 * (e.g. Swagger schema generation via `mongoose-to-swagger`).
 *
 * @module bootstrap/loadModels
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'models');

const models = {};

fs.readdirSync(modelsDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const filePath = path.join(modelsDir, file);
    const mod = require(filePath);
    if (mod && mod.modelName) {
      models[mod.modelName] = mod;
    }
  });

module.exports = { models };
