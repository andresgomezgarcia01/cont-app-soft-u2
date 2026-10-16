# Imagen de la base de datos del catálogo.
# Parte de la imagen oficial de PostgreSQL y le incorpora el esquema, de modo
# que la base nace con sus tablas la primera vez que arranca con volumen vacío.
#
# Nota: si se cambia a PostgreSQL 18 o superior, el volumen se monta en
# /var/lib/postgresql y no en /var/lib/postgresql/data (ver ADR-0008).
FROM postgres:17-alpine

LABEL org.opencontainers.image.title="catalogo-db" \
      org.opencontainers.image.description="PostgreSQL con el esquema del catálogo de aplicaciones"

# Postgres ejecuta, en orden alfabético, los *.sql de este directorio.
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
