/**
 * Seeder Auto-Loader
 *
 * Scans `src/seeders/` for `*.seeder.js` definition files and runs them.
 * Each seeder file exports { model, count, generate(i) }.
 *
 * Supports both MongoDB (via Mongoose) and PostgreSQL (via dbStrategy).
 *
 * @module bootstrap/loadSeeders
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../lib/utils/logger');

const seedersDir = path.join(__dirname, '..', 'seeders');
const seederPattern = /\.seeder\.js$/;

/**
 * Discover seeder definition files, optionally filtered by name.
 *
 * @param {string} [only] - Filter to a single seeder (without extension)
 * @returns {Array<{ name: string, def: object }>}
 */
function discoverSeeders(only) {
  const files = fs.readdirSync(seedersDir).filter(f => seederPattern.test(f));
  const seeders = files.map(f => ({ name: f.replace(seederPattern, ''), def: require(path.join(seedersDir, f)) }));

  if (only) {
    const filtered = seeders.filter(s => s.name === only);
    if (!filtered.length) {
      console.error(`Seeder "${only}" not found. Available: ${seeders.map(s => s.name).join(', ')}`);
      process.exit(1);
    }
    return filtered;
  }

  return seeders;
}

/**
 * Execute seeders using Mongoose (MongoDB).
 */
async function runSeedersMongoose(entries, clean = false) {
  for (const { name, def } of entries) {
    const Model = mongoose.model(def.model);
    if (!Model) {
      logger.warn(`Model "${def.model}" not registered, skipping seeder "${name}"`);
      continue;
    }

    if (clean) {
      await Model.deleteMany({});
      console.log(`  \u{1F5D1} Cleared "${def.model}" collection`);
    }

    const count = def.count || 10;
    const docs = Array.from({ length: count }, (_, i) => def.generate(i));
    await Model.insertMany(docs);

    console.log(`  \u{2714} Seeded ${count} "${def.model}" records (seeder: ${name})`);
  }
}

/**
 * Execute seeders using dbStrategy (PostgreSQL).
 */
async function runSeedersPg(entries, clean = false, strategy) {
  for (const { name, def } of entries) {
    if (clean) {
      await strategy.truncate(def.model);
      console.log(`  \u{1F5D1} Cleared "${def.model}" table`);
    }

    const count = def.count || 10;
    const docs = Array.from({ length: count }, (_, i) => def.generate(i));
    await strategy.insertMany(def.model, docs);

    console.log(`  \u{2714} Seeded ${count} "${def.model}" records (seeder: ${name})`);
  }
}

/**
 * High-level run: discover + execute seeders.
 *
 * @param {Object}   [options]
 * @param {boolean}  [options.clean=false]
 * @param {string}   [options.only] - Seeder name filter
 * @param {Object}   [options.strategy] - dbStrategy (required for PostgreSQL)
 */
async function run(options = {}) {
  const entries = discoverSeeders(options.only);
  if (!entries.length) {
    console.log('  No seeders found.');
    return;
  }

  console.log(`\n  Seeding ${entries.length} entr${entries.length > 1 ? 'ies' : 'y'}...\n`);

  if (options.strategy) {
    await runSeedersPg(entries, options.clean, options.strategy);
  } else {
    await runSeedersMongoose(entries, options.clean);
  }

  console.log('\n  Done.\n');
}

module.exports = { run, discoverSeeders };
