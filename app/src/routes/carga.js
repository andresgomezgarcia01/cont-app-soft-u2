
const express = require('express');
const multer = require('multer');
const servicioImportacion = require('../services/importacion');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

router.get('/', (req, res) => {
  res.render('carga', { error: null, mensaje: null });
});

router.post('/', (req, res) => {
  upload.single('archivo')(req, res, async (errorMulter) => {
    if (errorMulter) {
      const mensaje = errorMulter.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo no puede superar los 2 MB.'
        : 'No fue posible recibir el archivo. Verifica que sea válido.';

      return res.status(400).render('carga', {
        error: mensaje,
        mensaje: null,
      });
    }

    if (!req.file) {
      return res.status(400).render('carga', {
        error: 'Debes seleccionar un archivo CSV.',
        mensaje: null,
      });
    }

    try {
      const aplicaciones = servicioImportacion.prepararCSV(req.file.buffer);
      const creadas = await servicioImportacion.guardarAplicaciones(aplicaciones);

      return res.render('carga', {
        error: null,
        mensaje: `Importación completada: ${creadas.length} aplicaciones y ${creadas.reduce((total, app) => total + app.cantidadDespliegues, 0)} despliegues registrados.`,
      });
    } catch (error) {
      const status = [400, 409, 413, 422].includes(error.status)
        ? error.status
        : 500;

      if (status === 500) {
        console.error('Error durante la importación CSV:', error.message);
      }

      return res.status(status).render('carga', {
        error: status === 500
          ? 'No fue posible completar la importación. Verifica la conexión e inténtalo nuevamente.'
          : error.message,
        mensaje: null,
      });
    }
  });
});

module.exports = router;
