/**
 * Express Application
 *
 * Thin re-export of the bootstrapped application.
 * All initialisation logic lives in src/bootstrap/.
 *
 * @module app
 */

const { app } = require('./bootstrap');

module.exports = app;
