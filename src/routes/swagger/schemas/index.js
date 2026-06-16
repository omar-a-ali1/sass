/**
 * Schema Aggregator
 *
 * Re-exports all entity schema definitions for use by the
 * shared OpenAPI components module.
 *
 * @module routes/swagger/schemas/index
 */

const userEntities = require('./user.entity');

module.exports = {
  ...userEntities
};