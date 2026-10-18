
const express = require('express');
const servicioAplicaciones = require('../services/aplicaciones');
const servicioDespliegues = require('../services/despliegues');


const router = express.Router();

// GET /aplicaciones
// Lista y permite buscar aplicaciones.
router.get('/', async (req, res) => {
  const busqueda = typeof req.query.q === 'string'
    ? req.query.q
    : '';

  try {
    const aplicaciones = await servicioAplicaciones.listar(busqueda);

    return res.render('lista', {
      aplicaciones,
      busqueda,
      error: null,
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).render('lista', {
        aplicaciones: [],
        busqueda,
        error: error.message,
      });
    }

    console.error(
      'Error al consultar las aplicaciones:',
      error.message
    );

    return res.status(500).render('lista', {
      aplicaciones: [],
      busqueda,
      error: 'No fue posible cargar las aplicaciones. Intenta nuevamente.',
    });
  }
});

// GET /aplicaciones/nueva
// Muestra el formulario de registro.
router.get('/nueva', (req, res) => {
  return res.render('nueva', {
    error: null,
    datos: {},
  });
});

// POST /aplicaciones
// Valida y registra una aplicación.
router.post('/', async (req, res) => {
  try {
    await servicioAplicaciones.crear(req.body);

    return res.redirect('/aplicaciones');
  } catch (error) {
    const status = [409, 422].includes(error.status)
      ? error.status
      : 500;

    if (status === 500) {
      console.error(
        'Error al crear la aplicación:',
        error.message
      );
    }

    return res.status(status).render('nueva', {
      error: status === 500
        ? 'No fue posible guardar la aplicación. Intenta nuevamente.'
        : error.message,
      datos: req.body,
    });
  }
});

// GET /aplicaciones/:id
// Muestra el detalle de una aplicación y sus despliegues.
router.get('/:id', async (req, res) => {
  try {
    const aplicacion = await servicioAplicaciones.obtenerDetalle(
      req.params.id
    );

    
const mensajeError =
  typeof req.query.error === 'string'
    ? req.query.error
    : null;

return res.render('detalle', {
  aplicacion,
  error: mensajeError,
  datosDespliegue: {},
});

  } catch (error) {
    if ([400, 404].includes(error.status)) {
      return res.status(error.status).render('error', {
        codigo: error.status,
        mensaje: error.message,
      });
    }

    console.error(
      'Error al consultar el detalle:',
      error.message
    );

    return res.status(500).render('error', {
      codigo: 500,
      mensaje: 'No fue posible consultar la aplicación. Intenta nuevamente.',
    });
  }
});


router.post('/:id/despliegues', async (req, res) => {
  try {
    await servicioDespliegues.crear(
      req.params.id,
      req.body
    );

    return res.redirect(`/aplicaciones/${req.params.id}`);
  } catch (error) {
    const status = [400, 404, 409, 422].includes(error.status)
      ? error.status
      : 500;

    if (status === 500) {
      console.error(
        'Error al crear el despliegue:',
        error.message
      );
    }

    if ([400, 404, 500].includes(status)) {
      return res.status(status).render('error', {
        codigo: status,
        mensaje:
          status === 500
            ? 'No fue posible registrar el despliegue. Intenta nuevamente.'
            : error.message,
      });
    }

    return res.redirect(
      `/aplicaciones/${req.params.id}?error=${encodeURIComponent(error.message)}`
    );
  }
});



module.exports = router;
