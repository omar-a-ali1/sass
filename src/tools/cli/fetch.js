#!/usr/bin/env node

const path = require('path');
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('dotenv').config({
  path: path.resolve(__dirname, '..', `.env.${process.env.NODE_ENV}`),
  override: true,
});

const config = require('../../config/environment');
const { models } = require('../../bootstrap/loadModels');

const modelNames = Object.keys(models);
const colors = {
  header: '\x1b[1m',
  dim:    '\x1b[90m',
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
};

const REDACTED = new Set(['password', 'token', 'secret', 'refreshToken']);
const MAX_CELL = 50;

function formatCell(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString().replace('T', ' ').replace(/\.\d{3}Z/, '');
  if (typeof val === 'object') return JSON.stringify(val);
  let s = String(val);
  if (s.length > MAX_CELL) s = s.slice(0, MAX_CELL - 3) + '...';
  return s;
}

function fmtTable(rows) {
  if (!rows.length) return '  (no results)';
  const cols = Object.keys(rows[0]);

  const fmtRows = rows.map(r => {
    const copy = { ...r };
    for (const c of cols) {
      if (REDACTED.has(c) && copy[c]) copy[c] = '••••••••';
      copy[c] = formatCell(copy[c]);
    }
    return copy;
  });

  const widths = cols.map(c => Math.max(c.length, ...fmtRows.map(r => String(r[c] ?? '').length)));
  const line = (sep) => '  +' + widths.map(w => sep.repeat(w + 2)).join('+') + '+';
  const row = (r) => '  |' + cols.map((c, i) => ' ' + String(r[c] ?? '').padEnd(widths[i]) + ' ').join('|') + '|';

  let out = line('-') + '\n';
  out += row(Object.fromEntries(cols.map(c => [c, c]))) + '\n';
  out += line('=') + '\n';
  for (const r of fmtRows) out += row(r) + '\n';
  out += line('-');
  return out;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const help = args.includes('--help') || args.includes('-h');
  const raw = args.includes('--raw');
  const model = args.find(a => !a.startsWith('-'));

  let id = null, where = null, limit = 20, page = 1, sort = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) id = args[++i];
    if (args[i] === '--where' && args[i + 1]) { try { where = JSON.parse(args[++i]); } catch { console.error('  --where must be valid JSON\n'); process.exit(1); } }
    if (args[i] === '--limit' && args[i + 1]) limit = parseInt(args[++i], 10);
    if (args[i] === '--page' && args[i + 1]) page = parseInt(args[++i], 10);
    if (args[i] === '--sort' && args[i + 1]) sort = args[++i];
  }

  return { help, raw, model, id, where, limit, page, sort };
}

function showHelp() {
  console.log(`
  Usage: npm run fetch -- <model> [options]

  Fetch records from the database by model name.

  Options:
    --id <id>         Fetch a single record by ID
    --where <json>    Filter conditions (e.g. '{"role":"admin"}')
    --limit <n>       Max records (default: 20)
    --page <n>        Page number (default: 1)
    --sort <field>    Sort field (prefix - for desc, e.g. -createdAt)
    --raw             Output raw JSON instead of table
    --help, -h        Show this help

  Examples:
    npm run fetch -- User
    npm run fetch -- User --limit 5
    npm run fetch -- User --id 1
    npm run fetch -- User --where '{"role":"admin"}'
    npm run fetch -- User --sort -createdAt --raw

  Available models: ${modelNames.join(', ')}
  `);
  process.exit(0);
}

const driver = config.database.driver;

(async () => {
  const opts = parseArgs();

  if (opts.help || !opts.model) showHelp();

  const modelName = opts.model.charAt(0).toUpperCase() + opts.model.slice(1);
  if (!modelNames.includes(modelName)) {
    console.error(`\n  ${colors.red}Unknown model "${opts.model}"${colors.reset}`);
    console.error(`  Available: ${modelNames.join(', ')}\n`);
    process.exit(1);
  }

  const table = modelName.toLowerCase() + 's';

  if (driver === 'postgres') {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: config.database.pgUri });

    try { await pool.query('SELECT 1'); }
    catch (err) {
      console.error(`\n  ${colors.red}Cannot connect to PostgreSQL${colors.reset}`);
      console.error(`  ${err.message}\n`);
      process.exit(1);
    }

    let rows;
    if (opts.id) {
      const { rows: r } = await pool.query(`SELECT * FROM "${table}" WHERE "id" = $1 LIMIT 1`, [opts.id]);
      rows = r;
    } else {
      const conditions = opts.where || {};
      const keys = Object.keys(conditions);
      const clause = keys.length ? 'WHERE ' + keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ') : '';
      const sortClause = opts.sort ? `ORDER BY "${opts.sort.replace(/^-/, '')}" ${opts.sort.startsWith('-') ? 'DESC' : 'ASC'}` : '';
      const offset = (opts.page - 1) * opts.limit;
      const params = [...Object.values(conditions)];
      const query = `SELECT * FROM "${table}" ${clause} ${sortClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

      const { rows: r } = await pool.query(query, [...params, opts.limit, offset]);
      rows = r;
    }

    await pool.end();

    if (opts.raw) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log(`\n  ${colors.cyan}${modelName}${colors.reset}  ${colors.dim}(PostgreSQL — "${table}")${colors.reset}`);
      const total = rows.length;
      console.log(`  ${colors.dim}${total} record${total !== 1 ? 's' : ''}${opts.id ? '' : ` (page ${opts.page})`}${colors.reset}\n`);
      console.log(fmtTable(rows));
      console.log();
    }

  } else {
    const mongoose = require('mongoose');

    try {
      await mongoose.connect(config.database.uri);
    } catch (err) {
      console.error(`\n  ${colors.red}Cannot connect to MongoDB${colors.reset}`);
      console.error(`  ${err.message}\n`);
      process.exit(1);
    }

    const Model = mongoose.model(modelName);
    let docs;

    if (opts.id) {
      docs = await Model.findById(opts.id).lean();
      docs = docs ? [docs] : [];
    } else {
      const filter = opts.where || {};
      let query = Model.find(filter);
      if (opts.sort) query = query.sort(opts.sort);
      query = query.skip((opts.page - 1) * opts.limit).limit(opts.limit);
      docs = await query.lean();
    }

    await mongoose.disconnect();

    if (opts.raw) {
      console.log(JSON.stringify(docs, null, 2));
    } else {
      console.log(`\n  ${colors.cyan}${modelName}${colors.reset}  ${colors.dim}(MongoDB — "${table}" collection)${colors.reset}`);
      const total = docs.length;
      console.log(`  ${colors.dim}${total} record${total !== 1 ? 's' : ''}${opts.id ? '' : ` (page ${opts.page})`}${colors.reset}\n`);
      console.log(fmtTable(docs));
      console.log();
    }
  }
})().catch(err => {
  console.error(`\n  ${colors.red}Error: ${err.message}${colors.reset}\n`);
  process.exit(1);
});
