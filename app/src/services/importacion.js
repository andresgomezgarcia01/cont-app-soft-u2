
const pool = require('../repositories/conexion');
const repositorioAplicaciones = require('../repositories/aplicaciones');
const repositorioDespliegues = require('../repositories/despliegues');
const { leerCSV } = require('./lector-csv');
const { agruparAplicaciones } = require('./agrupar-csv');
const { validarAplicaciones } = require('./validador-csv');

function prepararCSV(contenido) {
    const filas = leerCSV(contenido);
    const aplicaciones = agruparAplicaciones(filas);

    return validarAplicaciones(aplicaciones);
}
async function guardarAplicaciones(aplicaciones) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const creadas = [];

        for (const aplicacion of aplicaciones) {
            const existente = await repositorioAplicaciones.buscarPorNombre(
                client,
                aplicacion.nombre
            );

            if (existente) {
                const error = new Error(
                    `La aplicación "${aplicacion.nombre}" ya existe en el catálogo.`
                );
                error.status = 409;
                throw error;
            }

            const nueva = await repositorioAplicaciones.crear(
                client,
                aplicacion
            );

            for (const despliegue of aplicacion.despliegues) {
                await repositorioDespliegues.crear(client, {
                    ...despliegue,
                    aplicacion_id: nueva.id,
                });
            }

            creadas.push({
                id: nueva.id,
                nombre: aplicacion.nombre,
                cantidadDespliegues: aplicacion.despliegues.length,
            });
        }

        await client.query('COMMIT');
        return creadas;

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (errorRollback) {
            console.error(
                'No fue posible completar el rollback:',
                errorRollback.message
            );
        }

        if (error.code === '23505') {
            error.status = 409;
        }

        throw error;
    } finally {
        client.release();
    }

}

module.exports = {
    prepararCSV,
    guardarAplicaciones,
};
