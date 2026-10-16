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
-- Dónde y en qué versión está desplegada una aplicación, por ambiente.
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

COMMENT ON TABLE  despliegue           IS 'Despliegues de una aplicación, por ambiente';
COMMENT ON COLUMN despliegue.modalidad IS 'ON_PREMISE, NUBE o SAAS';
COMMENT ON COLUMN despliegue.ubicacion IS 'Región de la nube o datacenter (opcional)';

-- Acelera listar los despliegues de una aplicación y el JOIN del detalle.
CREATE INDEX ix_despliegue_aplicacion_id ON despliegue (aplicacion_id);

-- Nota: la regla "una aplicación SAAS debe ser de origen PROVEEDOR" involucra
-- dos tablas, por eso NO se implementa aquí sino en la capa de servicio de la
-- API (ver docs/errores.md y ADR-0003).
