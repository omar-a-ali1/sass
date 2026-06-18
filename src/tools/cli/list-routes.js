#!/usr/bin/env node

const path = require('path');
const { collectRoutes } = require('../../bootstrap/loadRoutes');
const config = require('../../config/environment');

const routes = collectRoutes();

const colors = {
  GET:     '\x1b[32m',
  POST:    '\x1b[33m',
  PUT:     '\x1b[34m',
  PATCH:   '\x1b[35m',
  DELETE:  '\x1b[31m',
  ANY:     '\x1b[90m',
  reset:   '\x1b[0m',
  dim:     '\x1b[90m',
  cyan:    '\x1b[36m',
  ul:      '\x1b[4m',
};

const base = `http://localhost:${config.port}`;

console.log(`\n  \x1b[1mRegistered Routes (${routes.length} total)\x1b[0m    ${colors.dim}${base}${colors.reset}\n`);

for (const route of routes) {
  const method = route.method.toUpperCase();
  const color = colors[method] || colors.ANY;
  const url = `${base}${route.path}`;
  const mwCount = route.middleware.length;
  const mwStr = mwCount > 0 ? `${mwCount} middleware` : '—';

  console.log(`  ${color}${method.padEnd(7)}${colors.reset} ${colors.cyan}${url}${colors.reset}`);
  console.log(`  ${''.padEnd(9)}${colors.dim}${route.path}${colors.reset}  ${colors.dim}${mwStr}${colors.reset}`);

  if (route.middleware.length > 0) {
    for (const mw of route.middleware) {
      const label = mw._label || mw.name || '(anonymous)';
      console.log(`  ${''.padEnd(11)}├─ ${colors.dim}${label}${colors.reset}`);
    }
  }
  console.log();
}

const staticNotes = [
  'GET  /          SASS work !',
  'GET  /api-docs  (Swagger UI, dev only)',
  'ANY  /*         (404 fallback)',
];
console.log(`  \x1b[1mStatic mounts\x1b[0m\n`);
for (const note of staticNotes) {
  console.log(`  ${colors.dim}${note}${colors.reset}`);
}
console.log();
