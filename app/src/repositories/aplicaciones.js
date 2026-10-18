
const pool = require('./conexion');

async function listar(busqueda = '') {
  const termino = busqueda.trim();

  const resultado = await pool.query(
    `SELECT
       a.id,
       a.nombre,
       a.origen,
       a.equipo_responsable,
       a.activa,
       a.fecha_registro,
       COUNT(d.id)::INTEGER AS cantidad_despliegues
     FROM aplicacion a
     LEFT JOIN despliegue d ON d.aplicacion_id = a.id
     WHERE a.nombre ILIKE $1
     GROUP BY a.id
     ORDER BY a.nombre ASC
     LIMIT 100`,
    [`%${termino}%`]
  );

  return resultado.rows;
}

async function crear(client, aplicacion) {
  const resultado = await client.query(
    `INSERT INTO aplicacion (
       nombre,
       descripcion,
       origen,
       equipo_responsable,
       activa
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      aplicacion.nombre,
      aplicacion.descripcion || null,
      aplicacion.origen,
      aplicacion.equipo_responsable,
      aplicacion.activa,
    ]
  );

  return resultado.rows[0];
}
async function buscarPorNombre(client, nombre) {
  const resultado = await client.query(
    'SELECT id FROM aplicacion WHERE nombre = $1',
    [nombre]
  );

  return resultado.rows[0] || null;
}

async function buscarPorId(id) {
  const resultado = await pool.query(
    `SELECT
       id,
       nombre,
       descripcion,
       origen,
       equipo_responsable,
       activa,
       fecha_registro
     FROM aplicacion
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
}

module.exports = {
  listar,
  crear,
  buscarPorNombre,
  buscarPorId,
};
