require('dotenv').config();
module.exports = {
    HOST: process.env.HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DATABASE,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    METRICS_HOSTNAME: localhost,
    METRICS_PORT: 8125
  };