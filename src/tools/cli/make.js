#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const type = process.argv[2];
const rawName = process.argv[3];

if (!type || !rawName || process.argv.includes('--help')) {
  console.log(`
  Usage:
    npm run make:{type} -- <Name>

  Types:
    controller   Generate a controller file
    route        Generate CRUD route files
    service      Generate a service file
    repository   Generate a repository file
  validation   Generate validation schema files
  model        Generate a Mongoose model file
  seeder       Generate a seeder file
  all          Generate everything (validation + model + repo + service + controller)

  Examples:
    npm run make:controller -- Product
    npm run make:route -- Product
    npm run make:service -- Product
    npm run make:repository -- Product
    npm run make:validation -- Product
    npm run make:model -- Product
    npm run make:seeder -- Product
    npm run make:all -- Product
  `);
  process.exit(0);
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str) {
  return str.replace(/_/g, '-').toLowerCase();
}

const Pascal = toPascalCase(rawName);
const camel = toCamelCase(rawName);
const kebab = toKebabCase(rawName);

function write(filePath, content) {
  const rel = path.relative(ROOT, filePath);
  if (fs.existsSync(filePath)) {
    console.log(`  ∼ ${rel} (exists, skipped)`);
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✔ ${rel}`);
  return true;
}

function makeValidation() {
  const dir = path.join(ROOT, 'src', 'validation', kebab);
  write(path.join(dir, 'create.js'), `const Joi = require('joi');

const Create${Pascal}Schema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

module.exports = Create${Pascal}Schema;
`);
  write(path.join(dir, 'update.js'), `const Joi = require('joi');

const Update${Pascal}Schema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
});

module.exports = Update${Pascal}Schema;
`);
  write(path.join(dir, 'list.js'), `const Joi = require('joi');

const List${Pascal}sQuery = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort:  Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional().allow(''),
});

module.exports = List${Pascal}sQuery;
`);
}

function makeModel() {
  write(path.join(ROOT, 'src', 'models', `${Pascal}.js`), `const mongoose = require('mongoose');

const schema = mongoose.Schema({
  name: { type: String, required: true },
});

  module.exports = mongoose.model('${Pascal}', schema);
`);
}

function makeSeeder() {
  write(path.join(ROOT, 'src', 'seeders', `${kebab}.seeder.js`), [
    "const { faker } = require('@faker-js/faker');",
    "const bcrypt = require('bcrypt');",
    '',
    'module.exports = {',
    "  model: '" + Pascal + "',",
    '  count: 10,',
    '  generate(i) {',
    '    return {',
    "      name: faker.person.fullName(),",
    "      email: faker.internet.email().toLowerCase(),",
    "      password: bcrypt.hashSync('password123', 10),",
    '    };',
    '  },',
    '};',
    '',
  ].join('\n'));
}

function makeRepository() {
  write(path.join(ROOT, 'src', 'repositories', `${camel}.repository.js`), `class ${Pascal}Repository {
  constructor({ dbStrategy }) {
    this.db = dbStrategy;
  }

  async findAll(query = {}) {
    return this.db.find('${Pascal}', query);
  }

  async findById(id) {
    return this.db.findById('${Pascal}', id);
  }

  async create(data) {
    return this.db.create('${Pascal}', data);
  }

  async updateById(id, data) {
    return this.db.findByIdAndUpdate('${Pascal}', id, data);
  }

  async deleteById(id) {
    return this.db.findByIdAndDelete('${Pascal}', id);
  }
}

module.exports = ${Pascal}Repository;
`);
}

function makeService() {
  write(path.join(ROOT, 'src', 'services', `${camel}Service.js`), `const NotFoundError = require('../lib/errors/NotFoundError');

class ${Pascal}Service {
  constructor({ ${camel}Repository }) {
    this.${camel}Repository = ${camel}Repository;
  }

  async list(query) {
    return this.${camel}Repository.findAll(query);
  }

  async get(id) {
    const item = await this.${camel}Repository.findById(id);
    if (!item) throw new NotFoundError('${Pascal} not found');
    return item;
  }

  async create(data) {
    return this.${camel}Repository.create(data);
  }

  async update(id, data) {
    const item = await this.${camel}Repository.updateById(id, data);
    if (!item) throw new NotFoundError('${Pascal} not found');
    return item;
  }

  async delete(id) {
    const item = await this.${camel}Repository.deleteById(id);
    if (!item) throw new NotFoundError('${Pascal} not found');
    return item;
  }
}

module.exports = ${Pascal}Service;
`);
}

function makeController() {
  write(path.join(ROOT, 'src', 'controllers', `${camel}.controller.js`), `const list = async (req, res, next) => {
  try {
    const ${camel}Service = req.getService('${camel}Service');
    const data = await ${camel}Service.list(req.validatedQuery);
    return res.paginated(data);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    const ${camel}Service = req.getService('${camel}Service');
    const data = await ${camel}Service.get(req.params.id);
    return res.respond(data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const ${camel}Service = req.getService('${camel}Service');
    const data = await ${camel}Service.create(req.validatedBody);
    return res.respond(data, 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const ${camel}Service = req.getService('${camel}Service');
    const data = await ${camel}Service.update(req.params.id, req.validatedBody);
    return res.respond(data);
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    const ${camel}Service = req.getService('${camel}Service');
    await ${camel}Service.delete(req.params.id);
    return res.respond(null, 204);
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, destroy };
`);
}

function makeRoute() {
  const dir = path.join(ROOT, 'src', 'routes', 'api', 'v1', kebab);

  write(path.join(dir, 'create.js'), `const validate = require('../../../../middlewares/validation');
const createSchema = require('../../../../validation/${kebab}/create');
const { create } = require('../../../../controllers/${camel}.controller');

module.exports = {
  method: 'post',
  path: '/',
  middleware: [validate(createSchema)],
  handler: create,
  docs: {
    tags: ['${Pascal}'],
    summary: 'Create a new ${kebab}',
    responses: {
      201: { description: '${Pascal} created' },
      400: { $ref: '#/components/responses/ValidationError' },
    },
  },
};
`);
  write(path.join(dir, 'list.js'), `const { validateQuery } = require('../../../../middlewares/validation');
const listQuery = require('../../../../validation/${kebab}/list');
const { list } = require('../../../../controllers/${camel}.controller');

module.exports = {
  method: 'get',
  path: '/',
  middleware: [validateQuery(listQuery)],
  handler: list,
  docs: {
    tags: ['${Pascal}'],
    summary: 'List ${kebab}s',
    responses: {
      200: { description: 'Paginated list of ${kebab}s' },
    },
  },
};
`);
  write(path.join(dir, 'get.js'), `const authenticate = require('../../../../middlewares/auth');
const { get } = require('../../../../controllers/${camel}.controller');

module.exports = {
  method: 'get',
  path: '/:id',
  middleware: [authenticate],
  handler: get,
  docs: {
    tags: ['${Pascal}'],
    summary: 'Get ${kebab} by ID',
    responses: {
      200: { description: '${Pascal} found' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
    },
  },
};
`);
  write(path.join(dir, 'update.js'), `const authenticate = require('../../../../middlewares/auth');
const validate = require('../../../../middlewares/validation');
const updateSchema = require('../../../../validation/${kebab}/update');
const { update } = require('../../../../controllers/${camel}.controller');

module.exports = {
  method: 'put',
  path: '/:id',
  middleware: [authenticate, validate(updateSchema)],
  handler: update,
  docs: {
    tags: ['${Pascal}'],
    summary: 'Update ${kebab} by ID',
    responses: {
      200: { description: '${Pascal} updated' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
    },
  },
};
`);
  write(path.join(dir, 'delete.js'), `const authenticate = require('../../../../middlewares/auth');
const { destroy } = require('../../../../controllers/${camel}.controller');

module.exports = {
  method: 'delete',
  path: '/:id',
  middleware: [authenticate],
  handler: destroy,
  docs: {
    tags: ['${Pascal}'],
    summary: 'Delete ${kebab} by ID',
    responses: {
      204: { description: '${Pascal} deleted' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
    },
  },
};
`);
}

function makeAll() {
  makeValidation();
  makeModel();
  makeRepository();
  makeService();
  makeController();

  console.log(`\n  ── Register in src/services/container.js ──\n`);
  console.log(`  const ${Pascal}Repository = require('../repositories/${camel}.repository');`);
  console.log(`  const ${Pascal}Service = require('../services/${camel}Service');\n`);
  console.log(`  const ${camel}Repo = new ${Pascal}Repository({ dbStrategy: container.get('dbStrategy') });`);
  console.log(`  container.register('${camel}Repository', ${camel}Repo);\n`);
  console.log(`  const ${camel}Service = new ${Pascal}Service({ ${camel}Repository: container.get('${camel}Repository') });`);
  console.log(`  container.register('${camel}Service', ${camel}Service);`);
}

const commands = {
  controller: makeController,
  route: makeRoute,
  service: makeService,
  repository: makeRepository,
  validation: makeValidation,
  model: makeModel,
  seeder: makeSeeder,
  all: makeAll,
};

const fn = commands[type];
if (!fn) {
  console.error(`Unknown type "${type}". Valid types: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

console.log(`\n  make:${type} ${Pascal}\n`);
fn();
console.log(`\n  Done.\n`);
