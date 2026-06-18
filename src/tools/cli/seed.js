#!/usr/bin/env node

const path = require('path');
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV === 'production') {
  console.error('\n  ✖ Refusing to seed a production database.\n    Set NODE_ENV to development or test to run seeders.\n');
  process.exit(1);
}

require('dotenv').config({
  path: path.resolve(__dirname, '..', `.env.${process.env.NODE_ENV}`),
  override: true,
});

const config = require('../../config/environment');
const connectDB = require('../../config/database');
const logger = require('../../lib/utils/logger');
require('../../bootstrap/loadModels');
const seeder = require('../../bootstrap/loadSeeders');

function parseArgs() {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  const clean = args.includes('--clean') || args.includes('-c');
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
  Usage: npm run seed [options]

  Options:
    --clean, -c   Drop existing documents before seeding
    --only <name> Seed only the specified seeder (e.g. --only user)
    --help, -h    Show this help

  Examples:
    npm run seed
    npm run seed -- --clean
    npm run seed -- --only user
    npm run seed -- --clean --only user
    `);
    process.exit(0);
  }

  return { clean, only };
}

(async () => {
  const opts = parseArgs();
  console.log(`\n  Environment: ${process.env.NODE_ENV}`);
  console.log(`  Driver:      ${config.database.driver}`);
  console.log(`  Clean:       ${opts.clean ? 'yes' : 'no'}`);
  if (opts.only) console.log(`  Only:        ${opts.only}`);

  if (config.database.driver === 'postgres') {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: config.database.pgUri });
    try { await pool.query('SELECT 1'); }
    catch (err) {
      console.error(`\n  ✖ PostgreSQL connection failed: ${err.message}\n`);
      process.exit(1);
    }

    const PostgresStrategy = require('../../lib/strategies/database/postgres.strategy');
    const strategy = new PostgresStrategy();
    strategy._pool = pool;

    await seeder.run({ ...opts, strategy });
    await pool.end();
  } else {
    try {
      await connectDB();
    } catch (err) {
      logger.error(`✖ Database connection failed: ${err.message}`)
      console.error(`\n  ✖ Database connection failed: ${err.message}`);
      console.error('  Check that MongoDB is running and MONGO_URI is correct.\n');
      process.exit(1);
    }

    await seeder.run(opts);
  }

  process.exit(0);
})().catch(err => {
  console.error(`\n  ✖ Seed failed: ${err.message}\n`);
  process.exit(1);
});
