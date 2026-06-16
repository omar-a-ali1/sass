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
const bcrypt = require('bcrypt')
const salt = require('../config/environment').bcrypt.salt

/** @type {import('mongoose').Schema} */
const schema = mongoose.Schema({
  /** User's full display name */
  name: String,
  /** Unique email address used for authentication */
  email: String,
  /** Bcrypt-hashed password (never stored in plain text) */
  password: String,
})

/*
 * Pre-save hook (disabled — hashing delegated to SecurityService)
 *
 * schema.pre('save', async function (next) {
 *   if (!this.isModified('password')) return;
 *   this.password = await bcrypt.hash(this.password, salt);
 *   next();
 * });
 */

const User = mongoose.model('User', schema)

module.exports = User