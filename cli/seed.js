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

const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');
require('../src/bootstrap/loadModels');
const seeder = require('../src/bootstrap/loadSeeders');

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
  console.log(`  Clean:       ${opts.clean ? 'yes' : 'no'}`);
  if (opts.only) console.log(`  Only:        ${opts.only}`);

  try {
    await connectDB();
  } catch (err) {
    console.error(`\n  ✖ Database connection failed: ${err.message}`);
    console.error('  Check that MongoDB is running and MONGO_URI is correct.\n');
    process.exit(1);
  }

  await seeder.run(opts);
  process.exit(0);
})().catch(err => {
  console.error(`\n  ✖ Seed failed: ${err.message}\n`);
  process.exit(1);
});
