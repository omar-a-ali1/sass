/**
 * Shared OpenAPI Components
 *
 * Assembles all reusable specification objects:
 * - Security schemes (bearer JWT)
 * - Error response templates (400, 401, 409, 500)
 * - Request/response schemas (auto-scanned from validation/ + model schemas)
 *
 * @module swagger/components/index
 */

const fs = require('fs');
const path = require('path');
const j2s = require('joi-to-swagger');
const m2s = require('mongoose-to-swagger');
const baseResponses = require('./responses');
const { models } = require('../../bootstrap/loadModels');

/**
 * Recursively scan a directory for Joi validation files and convert
 * each to an OpenAPI schema using joi-to-swagger.
 *
 * @param {string} dir     - Directory to scan (e.g. src/validation)
 * @param {string} baseDir - Root directory for relative path calculation
 * @returns {Object}       - { SchemaName: swaggerSchema, ... }
 */
function loadValidationSchemas(dir, baseDir = dir) {
  const schemas = {};

  if (!fs.existsSync(dir)) return schemas;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      Object.assign(schemas, loadValidationSchemas(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const schema = require(fullPath);
      if (!schema || typeof schema.validate !== 'function') continue;

      const name = path.basename(entry.name, '.js');
      const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
      schemas[`${pascalName}Request`] = j2s(schema).swagger;
    }
  }

  return schemas;
}

/** Fields to strip from auto-generated response schemas */
const SENSITIVE_FIELDS = new Set(['password', '__v', 'hashedKey', 'resetToken', 'refreshToken']);

/** Auto-generate OpenAPI schemas from loaded Mongoose models */
const modelSchemas = {};
for (const [name, mod] of Object.entries(models)) {
  const raw = m2s(mod);
  modelSchemas[name] = raw;

  // Generate a sanitized {Name}Response variant with sensitive fields removed
  const cleaned = JSON.parse(JSON.stringify(raw));
  if (cleaned.properties) {
    for (const field of SENSITIVE_FIELDS) {
      delete cleaned.properties[field];
    }
  }
  if (Array.isArray(cleaned.required)) {
    cleaned.required = cleaned.required.filter(f => !SENSITIVE_FIELDS.has(f));
  }
  modelSchemas[`${name}Response`] = cleaned;
}

/** Auto-scan validation/ directory for Joi schemas */
const validationDir = path.join(__dirname, '..', '..', 'validation');
const validationSchemas = loadValidationSchemas(validationDir);

module.exports = {
  /** Authentication schemes */
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token to access protected microservices.'
    },
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
      description: 'JWT stored in a cookie named "token". Sent automatically by the browser.'
    }
  },

  /** Shared error response definitions */
  responses: baseResponses,

  /** Request and response schema objects */
  schemas: {
    /** Auto-generated from Joi validation schemas (auto-scanned from validation/) */
    ...validationSchemas,

    /** Auto-generated from Mongoose models via mongoose-to-swagger */
    ...modelSchemas,
  }
};