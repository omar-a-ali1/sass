/**
 * User Model
 *
 * Mongoose schema and model for application users.
 * Password hashing is handled externally by SecurityService;
 * the pre-save hook is commented out and preserved for reference.
 *
 * @module models/User
 */

const mongoose = require('mongoose')

/** @type {import('mongoose').Schema} */
const schema = mongoose.Schema({
  /** User's full display name */
  name: String,
  /** Unique email address used for authentication */
  email: String,
  /** Bcrypt-hashed password (never stored in plain text) */
  password: String,
  /** Authorization role (default: 'user') */
  role: { type: String, default: 'user' },
})

const User = mongoose.model('User', schema)

module.exports = User