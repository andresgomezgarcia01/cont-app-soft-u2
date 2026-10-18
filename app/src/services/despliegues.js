
const pool = require('../repositories/conexion');
const repositorioAplicaciones = require('../repositories/aplicaciones');
const repositorioDespliegues = require('../repositories/despliegues');

const AMBIENTES = ['DEV', 'QA', 'PROD'];
const MODALIDADES = ['ON_PREMISE', 'NUBE', 'SAAS'];
const PROVEEDORES = ['AWS', 'AZURE', 'GCP', 'OTRO'];

function convertirFechaColombiaAUTC(fecha) {
  if (!fecha) {
    return new Date().toISOString();
  }

  // datetime-local entrega YYYY-MM-DDTHH:mm, sin zona horaria.
  const formatoLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  if (!formatoLocal.test(fecha)) {
    const error = new Error('La fecha debe tener un formato válido.');
    error.status = 422;
    throw error;
  }

  // Colombia usa UTC-5 y no aplica horario de verano.
  const fechaUTC = new Date(`${fecha}:00-05:00`);

  if (Number.isNaN(fechaUTC.getTime())) {
    const error = new Error('La fecha del despliegue no es válida.');
    error.status = 422;
    throw error;
  }

  // Evita que fechas imposibles se normalicen automáticamente.
  const partes = fecha.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  const fechaLocal = new Date(fechaUTC.getTime() - 5 * 60 * 60 * 1000);

  if (
    fechaLocal.getUTCFullYear() !== Number(partes[1]) ||
    fechaLocal.getUTCMonth() + 1 !== Number(partes[2]) ||
    fechaLocal.getUTCDate() !== Number(partes[3]) ||
    fechaLocal.getUTCHours() !== Number(partes[4]) ||
    fechaLocal.getUTCMinutes() !== Number(partes[5])
  ) {
    const error = new Error('La fecha del despliegue no es válida.');
    error.status = 422;
    throw error;
  }

  return fechaUTC.toISOString();
}


function validarDespliegue(datos) {
  const version =
    typeof datos.version === 'string' ? datos.version.trim() : '';

  const ambiente =
    typeof datos.ambiente === 'string' ? datos.ambiente.trim() : '';

  const modalidad =
    typeof datos.modalidad === 'string' ? datos.modalidad.trim() : '';

  const proveedor_nube =
    typeof datos.proveedor_nube === 'string'
      ? datos.proveedor_nube.trim()
      : '';

  const ubicacion =
    typeof datos.ubicacion === 'string' ? datos.ubicacion.trim() : '';

  const desplegado_en =
    typeof datos.desplegado_en === 'string'
      ? datos.desplegado_en.trim()
      : '';

  if (!version || version.length > 30) {
    const error = new Error(
      'La versión es obligatoria y debe tener máximo 30 caracteres.'
    );
    error.status = 422;
    throw error;
  }

  if (!AMBIENTES.includes(ambiente)) {
    const error = new Error('El ambiente seleccionado no es válido.');
    error.status = 422;
    throw error;
  }

  if (!MODALIDADES.includes(modalidad)) {
    const error = new Error('La modalidad seleccionada no es válida.');
    error.status = 422;
    throw error;
  }

  if (modalidad === 'NUBE') {
    if (!PROVEEDORES.includes(proveedor_nube)) {
      const error = new Error(
        'Debes seleccionar un proveedor válido para la modalidad NUBE.'
      );
      error.status = 422;
      throw error;
    }
  } else if (proveedor_nube) {
    const error = new Error(
      'El proveedor de nube solo se debe indicar para la modalidad NUBE.'
    );
    error.status = 422;
    throw error;
  }

  if (ubicacion.length > 100) {
    const error = new Error(
      'La ubicación debe tener máximo 100 caracteres.'
    );
    error.status = 422;
    throw error;
  }

  const fechaConvertida = convertirFechaColombiaAUTC(desplegado_en);

  return {
    version,
    ambiente,
    modalidad,
    proveedor_nube: proveedor_nube || null,
    ubicacion: ubicacion || null,
    desplegado_en: fechaConvertida,
  };
}

async function crear(aplicacionId, datos) {
  const id = Number(aplicacionId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('El identificador de la aplicación no es válido.');
    error.status = 400;
    throw error;
  }

  const aplicacion = await repositorioAplicaciones.buscarPorId(id);

  if (!aplicacion) {
    const error = new Error('La aplicación solicitada no existe.');
    error.status = 404;
    throw error;
  }

  const despliegue = validarDespliegue(datos);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const creado = await repositorioDespliegues.crear(client, {
      ...despliegue,
      aplicacion_id: id,
    });

    await client.query('COMMIT');

    return creado;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      error.status = 409;
      error.message =
        `La aplicación ya tiene un despliegue en el ambiente ${despliegue.ambiente}.`;
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = { crear };
