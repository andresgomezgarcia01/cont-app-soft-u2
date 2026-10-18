
const pool = require('../repositories/conexion');
const repositorioAplicaciones = require('../repositories/aplicaciones');

async function listar(busqueda = '') {
  if (busqueda.length > 100) {
    const error = new Error(
      'La búsqueda no puede superar 100 caracteres.'
    );
    error.status = 400;
    throw error;
  }

  return repositorioAplicaciones.listar(busqueda);
}

function validarAplicacion(datos) {
  const nombre = typeof datos.nombre === 'string'
    ? datos.nombre.trim()
    : '';

  const origen = typeof datos.origen === 'string'
    ? datos.origen.trim()
    : '';

  const equipoResponsable =
    typeof datos.equipo_responsable === 'string'
      ? datos.equipo_responsable.trim()
      : '';

  const descripcion = typeof datos.descripcion === 'string'
    ? datos.descripcion.trim()
    : '';

  if (!nombre || nombre.length > 100) {
    const error = new Error(
      'El nombre es obligatorio y debe tener máximo 100 caracteres.'
    );
    error.status = 422;
    throw error;
  }

  if (!['PROPIA', 'PROVEEDOR'].includes(origen)) {
    const error = new Error('Selecciona un origen válido.');
    error.status = 422;
    throw error;
  }

  if (
    !equipoResponsable ||
    equipoResponsable.length > 100
  ) {
    const error = new Error(
      'El equipo responsable es obligatorio y debe tener máximo 100 caracteres.'
    );
    error.status = 422;
    throw error;
  }

  return {
    nombre,
    descripcion: descripcion || null,
    origen,
    equipo_responsable: equipoResponsable,
    activa: datos.activa === 'on' || datos.activa === true,
  };
}

async function crear(datos) {
  const aplicacion = validarAplicacion(datos);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existente = await repositorioAplicaciones.buscarPorNombre(
      client,
      aplicacion.nombre
    );

    if (existente) {
      const error = new Error(
        'Ya existe una aplicación con ese nombre.'
      );
      error.status = 409;
      throw error;
    }

    const creada = await repositorioAplicaciones.crear(
      client,
      aplicacion
    );

    await client.query('COMMIT');
    return creada;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      error.status = 409;
      error.message = 'Ya existe una aplicación con ese nombre.';
    }

    throw error;
  } finally {
    client.release();
  }
}


async function obtenerDetalle(id) {
  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    const error = new Error('El identificador de la aplicación no es válido.');
    error.status = 400;
    throw error;
  }

  const aplicacion = await repositorioAplicaciones.buscarPorId(idNumerico);

  if (!aplicacion) {
    const error = new Error('La aplicación solicitada no existe.');
    error.status = 404;
    throw error;
  }

  const repositorioDespliegues = require('../repositories/despliegues');
  const despliegues = await repositorioDespliegues.listarPorAplicacion(idNumerico);

  return {
    ...aplicacion,
    despliegues,
  };
}


module.exports = {
  listar,
  crear,
  obtenerDetalle
};
