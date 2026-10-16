-- ============================================================================
-- Catálogo de aplicaciones: esquema de la base de datos (PostgreSQL)
--
-- Modelo: una aplicación tiene de 0 a N despliegues (relación 1 a N).
-- Este script se copia a /docker-entrypoint-initdb.d dentro de la imagen
-- (ver db/Dockerfile) y Postgres lo ejecuta UNA sola vez, cuando el contenedor
-- arranca con el volumen de datos vacío. Para volver a ejecutarlo hay que
-- borrar el volumen: docker compose down -v
-- ============================================================================

-- ----------------------------------------------------------------------------
-- aplicacion (7 columnas)
-- ----------------------------------------------------------------------------
CREATE TABLE aplicacion (
    id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre             VARCHAR(100) NOT NULL,
    descripcion        TEXT,
    origen             VARCHAR(10)  NOT NULL,
    equipo_responsable VARCHAR(100) NOT NULL,
    activa             BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro     DATE         NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT uq_aplicacion_nombre UNIQUE (nombre),
    CONSTRAINT ck_aplicacion_origen CHECK (origen IN ('PROPIA', 'PROVEEDOR'))
);

COMMENT ON TABLE  aplicacion        IS 'Catálogo de aplicaciones de la organización';
COMMENT ON COLUMN aplicacion.origen IS 'PROPIA: desarrollada internamente. PROVEEDOR: producto de un tercero';

-- ----------------------------------------------------------------------------
-- despliegue (8 columnas)
-- Despliegue vigente de una aplicación en un ambiente: la versión que HOY está
-- en ese ambiente, dónde y desde cuándo. Uno por ambiente como máximo (de 0 a 3
-- por aplicación). No se guarda historial.
-- ----------------------------------------------------------------------------
CREATE TABLE despliegue (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aplicacion_id  INTEGER      NOT NULL,
    version        VARCHAR(30)  NOT NULL,
    ambiente       VARCHAR(10)  NOT NULL,
    modalidad      VARCHAR(12)  NOT NULL,
    proveedor_nube VARCHAR(10),
    ubicacion      VARCHAR(100),
    desplegado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Si se borra la aplicación se borran sus despliegues (ver ADR-0004).
    CONSTRAINT fk_despliegue_aplicacion
        FOREIGN KEY (aplicacion_id) REFERENCES aplicacion (id) ON DELETE CASCADE,

    -- Como máximo un despliegue por aplicación y ambiente (estado actual).
    CONSTRAINT uq_despliegue_aplicacion_ambiente UNIQUE (aplicacion_id, ambiente),

    CONSTRAINT ck_despliegue_ambiente
        CHECK (ambiente IN ('DEV', 'QA', 'PROD')),
    CONSTRAINT ck_despliegue_modalidad
        CHECK (modalidad IN ('ON_PREMISE', 'NUBE', 'SAAS')),
    CONSTRAINT ck_despliegue_proveedor_nube
        CHECK (proveedor_nube IN ('AWS', 'AZURE', 'GCP', 'OTRO')),

    -- proveedor_nube es obligatorio si y solo si la modalidad es NUBE.
    CONSTRAINT ck_despliegue_nube_requiere_proveedor
        CHECK ((modalidad = 'NUBE') = (proveedor_nube IS NOT NULL))
);

COMMENT ON TABLE  despliegue           IS 'Despliegue vigente de una aplicación por ambiente (uno por ambiente)';
COMMENT ON COLUMN despliegue.modalidad IS 'ON_PREMISE, NUBE o SAAS';
COMMENT ON COLUMN despliegue.ubicacion IS 'Región de la nube o datacenter (opcional)';

-- No hace falta un índice aparte sobre aplicacion_id: el índice único de
-- uq_despliegue_aplicacion_ambiente empieza por esa columna, así que ya acelera
-- listar los despliegues de una aplicación y el JOIN del detalle.
