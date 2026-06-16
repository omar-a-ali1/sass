/**
 * Model Loader
 *
 * Automatically scans the `src/models/` directory and registers
 * every Mongoose model by requiring each file. Developers only
 * need to define their schema and call `mongoose.model()` —
 * no manual registration in the container required.
 *
 * @module models/index
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const models = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const filePath = path.join(__dirname, file);
    const mod = require(filePath);

    // If the file exports a model directly, use it
    // Otherwise the model is registered via mongoose.model() as a side effect
    if (mod && mod.modelName) {
      models[mod.modelName] = mod;
    }
  });

/** All registered Mongoose models keyed by model name */
module.exports = models;
