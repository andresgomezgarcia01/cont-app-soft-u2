
const { parse } = require('csv-parse/sync');

const COLUMNAS = [
  'nombre',
  'descripcion',
  'origen',
  'equipo_responsable',
  'activa',
  'version',
  'ambiente',
  'modalidad',
  'proveedor_nube',
  'ubicacion',
  'desplegado_en',
];

function leerCSV(contenido) {
  const texto = contenido.toString('utf8').replace(/^\uFEFF/, '');
  const primeraLinea = texto.split(/\r?\n/, 1)[0];

  const separador = primeraLinea.includes(';') ? ';' : ',';

  let filas;

  try {
    filas = parse(texto, {
      bom: true,
      delimiter: separador,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    });
  } catch (error) {
    const detalle = error.lines
      ? ` cerca de la línea ${error.lines}`
      : '';

    const problema = new Error(
      `El archivo CSV tiene un formato inválido${detalle}.`
    );
    problema.status = 400;
    throw problema;
  }

  if (filas.length === 0) {
    const error = new Error('El archivo CSV está vacío.');
    error.status = 400;
    throw error;
  }

  const encabezado = filas[0];

  if (
    encabezado.length !== COLUMNAS.length ||
    !COLUMNAS.every((columna) => encabezado.includes(columna))
  ) {
    const error = new Error(
      `El encabezado debe contener exactamente estas columnas: ${COLUMNAS.join(', ')}.`
    );
    error.status = 400;
    throw error;
  }

  const datos = filas.slice(1);

  const maximo = Number.parseInt(process.env.MAX_FILAS_CSV, 10) || 100;

  if (datos.length > maximo) {
    const error = new Error(
      `El archivo supera el límite de ${maximo} filas de datos.`
    );
    error.status = 413;
    throw error;
  }

  return datos.map((fila, indice) => {
    if (fila.length !== encabezado.length) {
      const error = new Error(
        `La fila ${indice + 2} no contiene las ${COLUMNAS.length} columnas requeridas.`
      );
      error.status = 400;
      throw error;
    }

    const registro = {};

    encabezado.forEach((columna, posicion) => {
      registro[columna] = fila[posicion];
    });

    return {
      fila: indice + 2,
      ...registro,
    };
  });
}

module.exports = { leerCSV };
