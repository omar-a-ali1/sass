const express = require('express')

//global middleware :
const injectServices = require("./middlewares/injectServices");
const errorHandler = require("./middlewares/errorHandler")
const tracer = require('./middlewares/tracer');
const app = express()
// include routes 
const routes = require("./routes/index")

app.use(express.json())
app.use(tracer)
app.use(injectServices)
app.use(routes)

app.use(errorHandler)

module.exports = app