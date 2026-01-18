require('dotenv').config();
const sharedConfig = {
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: {
    ...sharedConfig,
    timezone: '+00:00', // <--- IMPORTANTE: Fuerza a todo a hablar en UTC
    dialectOptions: {
      dateStrings: true, // Lee las fechas como strings para evitar conversiones automáticas
      typeCast: true,
    },
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
  },
  test: {
    ...sharedConfig,
    username: process.env.DB_USERNAME_TEST || process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || 'clinica_test',
    host: process.env.DB_HOST_TEST || process.env.DB_HOST,
    port: Number(process.env.DB_PORT_TEST || process.env.DB_PORT) || 3306,
  },
  production: {
    ...sharedConfig,
    username: process.env.DB_USERNAME_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    host: process.env.DB_HOST_PROD,
    port: Number(process.env.DB_PORT_PROD || process.env.DB_PORT) || 3306,
  },
};
