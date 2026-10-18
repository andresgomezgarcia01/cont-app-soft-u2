
const pool = require('./conexion');

async function crear(client, despliegue) {
  const resultado = await client.query(
    `INSERT INTO despliegue (
       aplicacion_id,
       version,
       ambiente,
       modalidad,
       proveedor_nube,
       ubicacion,
       desplegado_en
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      despliegue.aplicacion_id,
      despliegue.version,
      despliegue.ambiente,
      despliegue.modalidad,
      despliegue.proveedor_nube || null,
      despliegue.ubicacion || null,
      despliegue.desplegado_en || new Date().toISOString(),
    ]
  );

  return resultado.rows[0];
}


async function listarPorAplicacion(aplicacionId) {
  const resultado = await pool.query(
    `SELECT
       id,
       aplicacion_id,
       version,
       ambiente,
       modalidad,
       proveedor_nube,
       ubicacion,
       desplegado_en
     FROM despliegue
     WHERE aplicacion_id = $1
     ORDER BY
       CASE ambiente
         WHEN 'PROD' THEN 1
         WHEN 'QA' THEN 2
         WHEN 'DEV' THEN 3
       END`,
    [aplicacionId]
  );

  return resultado.rows;
}


module.exports = { crear, listarPorAplicacion };
