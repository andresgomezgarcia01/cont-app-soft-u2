// Esqueleto mínimo para que el contenedor arranque y se verifique.
// La especificación del desarrollo está en app/README.md.
const express = require('express');
const pool = require('./repositories/conexion');

// Configuración desde variables de entorno (en Docker las pone docker-compose.yml).
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;



// Un error en una conexión inactiva (por ejemplo, la base se reinicia) se
// registra en lugar de terminar el proceso.
pool.on('error', (error) => {
  console.error('Error en una conexión inactiva con la base de datos:', error.message);
});

const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/aplicaciones', require('./routes/aplicaciones'));
app.use('/carga', require('./routes/carga'));

// Página principal: redirige al catálogo.
app.get('/', (req, res) => {
  res.redirect('/aplicaciones');
});

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

// 404: ninguna ruta anterior atendió la solicitud.
app.use((req, res) => {
  return res.status(404).render('error', {
    codigo: 404,
    mensaje: 'La página que buscas no existe. Verifica la dirección e inténtalo nuevamente.',
  });
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
