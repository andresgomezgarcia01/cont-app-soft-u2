-- ============================================================================
-- Datos base del catálogo (seed)
--
-- Idempotente: se puede ejecutar varias veces sin duplicar registros.
-- Los ejecuta el servicio "seed" de docker-compose.yml, un job de ejecución
-- única que termina cuando acaba de cargar.
--
-- Carga 4 aplicaciones y 6 despliegues (10 registros). El resto de los datos
-- de la actividad se ingresan desde la aplicación (formulario y carga masiva).
-- Todos los datos son ficticios.
-- ============================================================================

BEGIN;

INSERT INTO aplicacion (nombre, descripcion, origen, equipo_responsable, activa) VALUES
    ('Portal de Clientes',
     'Portal web donde los clientes consultan y gestionan sus productos',
     'PROPIA', 'Canales Digitales', TRUE),
    ('Sistema de Nómina',
     'Liquidación de nómina y novedades de personal',
     'PROVEEDOR', 'Talento Humano', TRUE),
    ('CRM Comercial',
     'Gestión de clientes potenciales y oportunidades de venta',
     'PROVEEDOR', 'Comercial', TRUE),
    ('Gestor Documental Legado',
     'Archivo digital de documentos históricos, en proceso de retiro',
     'PROPIA', 'Operaciones', FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- Despliegues: se enlazan a la aplicación por nombre para no depender de ids.
INSERT INTO despliegue (aplicacion_id, version, ambiente, modalidad, proveedor_nube, ubicacion)
SELECT a.id, v.version, v.ambiente, v.modalidad, v.proveedor_nube, v.ubicacion
FROM (VALUES
    ('Portal de Clientes',       '2.3.0',    'PROD', 'NUBE',       'AWS', 'us-east-1'),
    ('Portal de Clientes',       '2.4.0-rc1', 'QA',  'NUBE',       'AWS', 'us-east-1'),
    ('Portal de Clientes',       '2.3.0',    'DEV',  'ON_PREMISE', NULL,  'Datacenter principal'),
    ('Sistema de Nómina',        '8.1.2',    'PROD', 'ON_PREMISE', NULL,  'Datacenter principal'),
    ('CRM Comercial',            '2026.3',   'PROD', 'SAAS',       NULL,  'Gestionado por el proveedor'),
    ('Gestor Documental Legado', '1.9.2',    'PROD', 'ON_PREMISE', NULL,  'Datacenter alterno')
) AS v (app, version, ambiente, modalidad, proveedor_nube, ubicacion)
JOIN aplicacion a ON a.nombre = v.app
WHERE NOT EXISTS (
    SELECT 1
    FROM despliegue d
    WHERE d.aplicacion_id = a.id
      AND d.version       = v.version
      AND d.ambiente      = v.ambiente
);

COMMIT;
