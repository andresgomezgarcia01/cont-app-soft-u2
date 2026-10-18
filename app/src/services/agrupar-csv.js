
const CAMPOS_DESPLIEGUE = [
  'version',
  'ambiente',
  'modalidad',
  'proveedor_nube',
  'ubicacion',
  'desplegado_en',
];

function agruparAplicaciones(filas) {
  const aplicaciones = new Map();

  for (const fila of filas) {
    const nombre = fila.nombre;

    if (!aplicaciones.has(nombre)) {
      aplicaciones.set(nombre, {
        nombre,
        descripcion: fila.descripcion,
        origen: fila.origen,
        equipo_responsable: fila.equipo_responsable,
        activa: fila.activa,
        fila: fila.fila,
        despliegues: [],
      });
    }

    const tieneDespliegue = CAMPOS_DESPLIEGUE.some(
      (campo) => fila[campo] !== ''
    );

    if (tieneDespliegue) {
      aplicaciones.get(nombre).despliegues.push({
        version: fila.version,
        ambiente: fila.ambiente,
        modalidad: fila.modalidad,
        proveedor_nube: fila.proveedor_nube,
        ubicacion: fila.ubicacion,
        desplegado_en: fila.desplegado_en,
        fila: fila.fila,
      });
    }
  }

  return Array.from(aplicaciones.values());
}

module.exports = { agruparAplicaciones };
