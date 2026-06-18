/**
 * ApiKey Model
 *
 * Stores API key metadata. The raw key is returned once on creation;
 * only the bcrypt hash and a lookup prefix are persisted.
 *
 * @module models/ApiKey
 */

const mongoose = require('mongoose')

const schema = mongoose.Schema({
  prefix:      { type: String, required: true },
  hashedKey:   { type: String, required: true },
  name:        { type: String, required: true },
  user:        { type: String, required: true },
  lastUsedAt:  { type: Date },
  expiresAt:   { type: Date },
  active:      { type: Boolean, default: true },
  permissions: [String],
}, { timestamps: true })

schema.index({ prefix: 1 })
schema.index({ user: 1 })

module.exports = mongoose.model('ApiKey', schema)
