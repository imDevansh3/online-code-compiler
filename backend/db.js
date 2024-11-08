const { Client } = require('pg');
require('dotenv').config(); // For loading environment variables from .env

const connectWithRetry = () => {
  const client = new Client({
    user: process.env.PG_USER || 'devansh',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DB || 'oc',
    port: process.env.PG_PORT || 5432,
  });

  client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => {
      console.error('Connection error', err.stack);
      setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    });

  return client;
};

module.exports = connectWithRetry();
