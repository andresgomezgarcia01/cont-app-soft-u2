const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'catalogo',
  user: process.env.DB_USER || 'catalogo',
  password: process.env.DB_PASSWORD || 'catalogo_dev',
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
});

pool.on('error', (error) => {
  console.error(
    'Error en una conexión inactiva con la base de datos:',
    error.message
  );
});

module.exports = pool;