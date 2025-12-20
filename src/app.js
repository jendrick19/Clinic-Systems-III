const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./shared/middlewares/errorHandler');

const app = express();

// Configuración de CORS para permitir peticiones desde Vue
app.use(cors({
  origin: 'http://localhost:5173', // URL de tu frontend Vue
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);
app.use(errorHandler);

module.exports = app;
