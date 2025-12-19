const express = require('express');
const routes = require('./routes');
const errorHandler = require('./shared/middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);
app.use(errorHandler);

module.exports = app;
