#!/usr/bin/env node

const path = require('path');

const config = require('../../config/environment');
const { models: localModels } = require('../../bootstrap/loadModels');

const modelsDir = path.join(__dirname, '..', '..', 'models');

const fs = require('fs');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && f !== 'index.js');

const modelNames = files.map(f => path.basename(f, '.js'));

const colors = {
  header: '\x1b[1m',
  dim:    '\x1b[90m',
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
};

function fmtTable(rows) {
  if (!rows.length) return '  (none)';
  const cols = Object.keys(rows[0]);
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] || '').length)));
  const line = (sep) => '  +' + widths.map(w => sep.repeat(w + 2)).join('+') + '+';
  const row = (r) => '  |' + cols.map((c, i) => ' ' + String(r[c] || '').padEnd(widths[i]) + ' ').join('|') + '|';

  let out = line('-') + '\n';
  out += row(Object.fromEntries(cols.map(c => [c, c]))) + '\n';
  out += line('=') + '\n';
  for (const r of rows) out += row(r) + '\n';
  out += line('-');
  return out;
}

const driver = config.database.driver;

(async () => {
  console.log(`\n  ${colors.header}Models${colors.reset}  ${colors.dim}(driver: ${driver})${colors.reset}\n`);

  if (driver === 'postgres') {
    let pool;
    try {
      const { Pool } = require('pg');
      pool = new Pool({ connectionString: config.database.pgUri });
      // verify connection
      await pool.query('SELECT 1');
    } catch (err) {
      console.log(`  ${colors.yellow}Cannot connect to PostgreSQL at ${config.database.pgUri}${colors.reset}`);
      console.log(`  ${colors.yellow}${err.message}${colors.reset}\n`);
      process.exit(1);
    }

    for (const name of modelNames) {
      const table = name.toLowerCase() + 's';
      const { rows } = await pool.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );

      const fields = rows.map(r => ({
        column: r.column_name,
        type:    r.data_type,
        null:    r.is_nullable === 'YES' ? 'Y' : '',
        default: r.column_default || '',
      }));

      console.log(`  ${colors.cyan}${name}${colors.reset}  ${colors.dim}→ ${table}${colors.reset}`);
      if (fields.length) {
        console.log(fmtTable(fields));
      } else {
        console.log(`  ${colors.yellow}  (table "${table}" does not exist)${colors.reset}`);
      }
      console.log();
    }

    await pool.end();

  } else {
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
      console.log(`  ${colors.yellow}MongoDB not connected — showing schema-defined fields only${colors.reset}\n`);
    }

    for (const name of modelNames) {
      const table = name.toLowerCase() + 's';
      let model;
      try { model = mongoose.model(name); } catch { model = null; }

      console.log(`  ${colors.cyan}${name}${colors.reset}  ${colors.dim}→ ${table}${colors.reset}`);

      if (model && model.schema) {
        const schemaPaths = model.schema.paths || {};
        const fields = Object.entries(schemaPaths)
          .filter(([k]) => k !== '__v')
          .map(([field, schemaType]) => ({
            field,
            type: schemaType.instance || typeof schemaType,
            required: schemaType.isRequired ? 'Y' : '',
            default: schemaType.defaultValue !== undefined ? String(schemaType.defaultValue) : '',
          }));

        if (fields.length) {
          console.log(fmtTable(fields.map(f => ({
            column:   f.field,
            type:     f.type,
            required: f.required,
            default:  f.default,
          }))));
        }
      } else {
        const mod = localModels[name];
        if (mod && mod.schema) {
          const schemaPaths = mod.schema.paths || {};
          const fields = Object.entries(schemaPaths)
            .filter(([k]) => k !== '__v')
            .map(([field, schemaType]) => ({
              column:   field,
              type:     schemaType.instance || typeof schemaType,
              required: schemaType.isRequired ? 'Y' : '',
              default:  schemaType.defaultValue !== undefined ? String(schemaType.defaultValue) : '',
            }));
          console.log(fmtTable(fields));
        } else {
          console.log(`  ${colors.dim}(could not read schema)${colors.reset}`);
        }
      }
      console.log();
    }
  }
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
