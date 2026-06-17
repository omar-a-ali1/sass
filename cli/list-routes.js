#!/usr/bin/env node

const path = require('path');
const { collectRoutes, routePrefix } = require('../src/bootstrap/loadRoutes');
const config = require('../src/config/environment');

const routesDir = path.join(__dirname, '..', 'src', 'routes', routePrefix.replace(/^\//, ''));
const routes = collectRoutes(routesDir);

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
  const fullPath = routePrefix + route.path;
  const url = `${base}${fullPath}`;
  const mwCount = route.middleware.length;
  const mwStr = mwCount > 0 ? `${mwCount} middleware` : '—';

  console.log(`  ${color}${method.padEnd(7)}${colors.reset} ${colors.cyan}${url}${colors.reset}`);
  console.log(`  ${''.padEnd(9)}${colors.dim}${fullPath}${colors.reset}  ${colors.dim}${mwStr}${colors.reset}`);

  if (route.middleware.length > 0) {
    for (const mw of route.middleware) {
      let label = mw.name || '';
      if (mw._validationSchema) label = 'validate(body)';
      else if (mw._queryValidationSchema) label = 'validateQuery';
      else if (label === 'middleware') label = 'validate(body)';
      else if (!label) {
        label = mw.constructor.name === 'AsyncFunction' ? 'rateLimiter' : '(anonymous)';
      }
      console.log(`  ${''.padEnd(11)}├─ ${colors.dim}${label}${colors.reset}`);
    }
  }
  console.log();
}

console.log(`  \x1b[1mStatic mounts\x1b[0m\n`);
const staticRoutes = [
  ['GET', '/', ''],
  ['GET', '/health', ''],
  ['GET', '/api-docs', '(Swagger UI, dev only)'],
  ['ANY', '/*', '(404 fallback)'],
];
for (const [method, p, note] of staticRoutes) {
  const color = colors[method] || colors.ANY;
  const url = `${base}${p}`;
  console.log(`  ${color}${method.padEnd(7)}${colors.reset} ${colors.cyan}${url}${colors.reset} ${colors.dim}${note}${colors.reset}`);
}
console.log();
