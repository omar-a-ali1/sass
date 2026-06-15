const express = require('express')

//global middleware :
const routes = require("./routes/index")
const errorHandler = require("./middlewares/errorHandler")
const tracer = require('./middlewares/tracer');
const app = express()

app.use(express.json())

app.use(routes)

app.use(tracer)
app.use(errorHandler)

module.exports = app