// Esqueleto mínimo para que el contenedor arranque y se verifique.
// La especificación del desarrollo está en app/README.md.
const express = require('express');
const { Pool } = require('pg');

// Configuración desde variables de entorno (en Docker las pone docker-compose.yml).
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'catalogo',
  user: process.env.DB_USER || 'catalogo',
  password: process.env.DB_PASSWORD || 'catalogo_dev',
  // Si la base no responde en 5 s, la consulta falla en vez de quedar colgada:
  // connectionTimeoutMillis limita el tiempo para abrir una conexión nueva y
  // query_timeout el de cada consulta, también sobre una conexión ya abierta.
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
});

// Un error en una conexión inactiva (por ejemplo, la base se reinicia) se
// registra en lugar de terminar el proceso.
pool.on('error', (error) => {
  console.error('Error en una conexión inactiva con la base de datos:', error.message);
});

const app = express();

// Estado del servicio: dice si la aplicación llega a la base de datos.
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ estado: 'ok' });
  } catch (error) {
    console.error('Health: no se pudo conectar con la base de datos:', error.message);
    res.status(503).json({
      codigo: 'SERVICIO_NO_DISPONIBLE',
      mensaje: 'La aplicación no logra conectar con la base de datos',
      detalles: [],
    });
  }
});

// Escucha en 0.0.0.0 para aceptar conexiones desde fuera del contenedor.
const servidor = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Catálogo de aplicaciones escuchando en el puerto ${PORT}`);
});

// Apagado ordenado: docker stop envía SIGTERM; Ctrl+C en local envía SIGINT.
let apagando = false;
function apagar(senal) {
  if (apagando) return;
  apagando = true;
  console.log(`Señal ${senal} recibida: cerrando la aplicación`);
  servidor.close(() => {
    pool
      .end()
      .catch((error) => console.error('Error al cerrar la conexión con la base:', error.message))
      .finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));
