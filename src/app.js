const express = require('express')
const path = require('path')
//global middleware :
const favicon = require('serve-favicon');
const injectServices = require("./middlewares/injectServices");
const errorHandler = require("./middlewares/errorHandler")
const tracer = require('./middlewares/tracer');
const app = express()
// include routes 
const routes = require("./routes/index")

app.use(favicon(path.join(__dirname, '../assets', 'favicon.ico')));
app.use(express.json())
app.use(tracer)
app.use(injectServices)
app.use(routes)

app.use(errorHandler)

module.exports = app