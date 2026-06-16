/**
 * Express Application Assembly
 *
 * Creates and configures the Express application instance.
 * Global middleware is registered in a specific order:
 * favicon → body parser → tracer → service injection → routes → error handler.
 *
 * @module app
 */

const express = require('express')
const path = require('path')
const favicon = require('serve-favicon');
const injectServices = require("./middlewares/injectServices");
const errorHandler = require("./middlewares/errorHandler")
const tracer = require('./middlewares/tracer');
const app = express()
const routes = require("./routes/index")

/** Serve favicon from assets directory */
app.use(favicon(path.join(__dirname, '../assets', 'favicon.ico')));

/** Parse JSON request bodies */
app.use(express.json())

/** Assign request ID and log HTTP traffic via Morgan → Winston */
app.use(tracer)

/** Attach IoC dependency container to each request */
app.use(injectServices)

/** Mount all route definitions */
app.use(routes)

/** Global error handler (must be registered last) */
app.use(errorHandler)

module.exports = app