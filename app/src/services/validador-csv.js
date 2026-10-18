
const ORIGENES = ['PROPIA', 'PROVEEDOR'];
const AMBIENTES = ['DEV', 'QA', 'PROD'];
const MODALIDADES = ['ON_PREMISE', 'NUBE', 'SAAS'];
const PROVEEDORES = ['AWS', 'AZURE', 'GCP', 'OTRO'];

function rechazar(fila, columna, mensaje, status = 422) {
  const error = new Error(
    `Fila ${fila}, columna "${columna}": ${mensaje}`
  );
  error.status = status;
  throw error;
}

function validarAplicacion(aplicacion) {
  const fila = aplicacion.fila;

  if (!aplicacion.nombre || aplicacion.nombre.length > 100) {
    rechazar(fila, 'nombre', 'Es obligatorio y debe tener máximo 100 caracteres.');
  }

  if (!ORIGENES.includes(aplicacion.origen)) {
    rechazar(fila, 'origen', 'Debe ser PROPIA o PROVEEDOR.');
  }

  if (
    !aplicacion.equipo_responsable ||
    aplicacion.equipo_responsable.length > 100
  ) {
    rechazar(
      fila,
      'equipo_responsable',
      'Es obligatorio y debe tener máximo 100 caracteres.'
    );
  }

  if (aplicacion.activa === '') {
    aplicacion.activa = true;
  } else if (['true', 'false'].includes(aplicacion.activa.toLowerCase())) {
    aplicacion.activa = aplicacion.activa.toLowerCase() === 'true';
  } else {
    rechazar(fila, 'activa', 'Debe ser true o false.');
  }

  return aplicacion;
}

function validarDespliegue(despliegue) {
  const fila = despliegue.fila;

  if (
    !despliegue.version ||
    despliegue.version.length > 30
  ) {
    rechazar(
      fila,
      'version',
      'Es obligatoria y debe tener máximo 30 caracteres.'
    );
  }

  if (!AMBIENTES.includes(despliegue.ambiente)) {
    rechazar(fila, 'ambiente', 'Debe ser DEV, QA o PROD.');
  }

  if (!MODALIDADES.includes(despliegue.modalidad)) {
    rechazar(
      fila,
      'modalidad',
      'Debe ser ON_PREMISE, NUBE o SAAS.'
    );
  }

  if (despliegue.modalidad === 'NUBE') {
    if (!PROVEEDORES.includes(despliegue.proveedor_nube)) {
      rechazar(
        fila,
        'proveedor_nube',
        'Es obligatorio para modalidad NUBE y debe ser AWS, AZURE, GCP u OTRO.'
      );
    }
  } else if (despliegue.proveedor_nube !== '') {
    rechazar(
      fila,
      'proveedor_nube',
      'Debe estar vacío cuando la modalidad no es NUBE.'
    );
  }

  if (despliegue.ubicacion.length > 100) {
    rechazar(fila, 'ubicacion', 'Debe tener máximo 100 caracteres.');
  }

  if (despliegue.desplegado_en !== '') {
    const fecha = new Date(despliegue.desplegado_en);

    if (Number.isNaN(fecha.getTime())) {
      rechazar(
        fila,
        'desplegado_en',
        'La fecha y hora no son válidas.'
      );
    }

    despliegue.desplegado_en = fecha.toISOString();
  } else {
    despliegue.desplegado_en = null;
  }

  return despliegue;
}

function validarAplicaciones(aplicaciones) {
  for (const aplicacion of aplicaciones) {
    validarAplicacion(aplicacion);

    const ambientes = new Set();

    for (const despliegue of aplicacion.despliegues) {
      validarDespliegue(despliegue);

      if (ambientes.has(despliegue.ambiente)) {
        rechazar(
          despliegue.fila,
          'ambiente',
          `La aplicación "${aplicacion.nombre}" ya tiene un despliegue en ${despliegue.ambiente}.`,
          409
        );
      }

      ambientes.add(despliegue.ambiente);
    }
  }

  return aplicaciones;
}

module.exports = { validarAplicaciones };
