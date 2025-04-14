const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
module.exports = {
  local: {
    dialect: 'mysql',
    host: process.env.DB_HOST_WRITE,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  development: {
    dialect: 'mysql',
    host: process.env.DB_HOST_WRITE,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  production: {
    dialect: 'mysql',
    host: process.env.DB_HOST_WRITE,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
