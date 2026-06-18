/**
 * PostgreSQL Schema Sync
 *
 * Reads Mongoose model definitions and syncs them to PostgreSQL:
 * - Creates missing tables
 * - Adds missing columns
 * - Never drops or alters existing columns
 * - Safe for development — existing data is preserved
 *
 * Usage:
 *   node cli/sync-db.js            # Sync all models
 *   node cli/sync-db.js User Store # Sync specific models
 *
 * @module cli/sync-db
 */

require('../../config/environment');

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const config = require('../../config/environment');

const PG_TYPE_MAP = {
  String:   'VARCHAR(255)',
  Number:   'INTEGER',
  Boolean:  'BOOLEAN',
  Date:     'TIMESTAMP',
  Buffer:   'BYTEA',
  'ObjectId': 'VARCHAR(24)',
};

function pgType(schemaType) {
  const name = schemaType?.name;
  if (PG_TYPE_MAP[name]) return PG_TYPE_MAP[name];
  if (Array.isArray(schemaType)) return 'JSONB';
  return 'JSONB';
}

function isNumeric(val) {
  return val !== null && !Number.isNaN(Number(val));
}

function defaultExpr(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function collectColumns(schema) {
  const cols = [];
  const paths = schema.paths || {};

  for (const [name, pathObj] of Object.entries(paths)) {
    if (name === '_id' || name === '__v') continue;

    const instance = pathObj.instance;
    const options = pathObj.options || {};
    const typeName = instance || 'Mixed';

    const col = {
      name,
      type: PG_TYPE_MAP[typeName] || 'JSONB',
      nullable: !options.required,
      default: options.default,
    };

    cols.push(col);
  }

  if (schema.options?.timestamps) {
    if (!cols.find(c => c.name === 'createdAt')) {
      cols.push({ name: 'createdAt', type: 'TIMESTAMP', nullable: true, default: 'NOW()' });
    }
    if (!cols.find(c => c.name === 'updatedAt')) {
      cols.push({ name: 'updatedAt', type: 'TIMESTAMP', nullable: true, default: 'NOW()' });
    }
  }

  return cols;
}

function quoteId(name) {
  return '"' + name.replace(/"/g, '""') + '"';
}

function createTableSQL(table, cols) {
  const lines = ['id SERIAL PRIMARY KEY'];
  for (const col of cols) {
    const parts = [quoteId(col.name), col.type];
    if (!col.nullable) parts.push('NOT NULL');
    const expr = defaultExpr(col.default);
    if (expr !== null) parts.push('DEFAULT ' + expr);
    lines.push(parts.join(' '));
  }
  return `CREATE TABLE ${quoteId(table)} (${lines.join(', ')});`;
}

function addColumnSQL(table, col) {
  const parts = ['ADD COLUMN', quoteId(col.name), col.type];
  if (!col.nullable) parts.push('NOT NULL');
  const expr = defaultExpr(col.default);
  if (expr !== null) parts.push('DEFAULT ' + expr);
  return `ALTER TABLE ${quoteId(table)} ${parts.join(' ')};`;
}

async function syncModel(pool, modelName, schema, log = true) {
  const table = modelName.toLowerCase() + 's';
  const cols = collectColumns(schema);

  const tableExists = await pool.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
    [table]
  ).then(r => r.rows[0].exists);

  if (!tableExists) {
    const sql = createTableSQL(table, cols);
    await pool.query(sql);
    if (log) console.log(`  ✔ Created table "${table}" with ${cols.length} columns`);
    return;
  }

  const existing = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table]
  ).then(r => new Set(r.rows.map(c => c.column_name)));

  let added = 0;
  for (const col of cols) {
    if (existing.has(col.name)) continue;
    const sql = addColumnSQL(table, col);
    await pool.query(sql);
    added++;
    if (log) console.log(`  ✔ Added column "${table}"."${col.name}" (${col.type})`);
  }

  if (added === 0 && log) {
    console.log(`  ✓ Table "${table}" is up to date`);
  }
}

async function main() {
  const specificModels = process.argv.slice(2).map(s => s.toLowerCase());

  console.log(`\n  PostgreSQL schema sync (${config.database.pgUri || 'no PG URI'})\n`);

  if (!config.database.pgUri) {
    console.log('  No POSTGRES_URI configured. Set it in .env.development to use this tool.\n');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: config.database.pgUri });

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.log(`  ✗ Cannot connect to PostgreSQL: ${err.message}\n`);
    await pool.end();
    process.exit(1);
  }

  const modelsDir = path.join(__dirname, '..', '..', 'models');
  const files = fs.readdirSync(modelsDir)
    .filter(f => f.endsWith('.js') && f !== 'index.js');

  let synced = 0;
  for (const file of files) {
    const model = require(path.join(modelsDir, file));
    const name = model.modelName || path.basename(file, '.js');

    if (specificModels.length && !specificModels.includes(name.toLowerCase())) continue;

    console.log(`  ${name}`);
    await syncModel(pool, name, model.schema, true);
    synced++;
  }

  console.log(`\n  Done. ${synced} model(s) synced.\n`);
  await pool.end();
}

main().catch(err => {
  console.error('  ✗ Fatal:', err.message);
  process.exit(1);
});
