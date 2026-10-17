# ADR-0002: PostgreSQL con esquema en scripts SQL, sin ORM

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

El enunciado pide una imagen de una base de datos relacional (cita MySQL como ejemplo) con dos tablas relacionadas, ejecutándose en un contenedor. La aplicación está escrita en Node.js ([ADR-0003](0003-aplicacion-monolitica-en-capas.md)).

## Decisión

- Motor: **PostgreSQL 17**, a partir de la imagen oficial `postgres:17-alpine`.
- El esquema (`db/schema.sql`) y los datos base (`db/seed/seed.sql`) son scripts SQL versionados en el repositorio.
- El esquema lo crea **la imagen de la base de datos** (copiando el script a `/docker-entrypoint-initdb.d/`), no la aplicación.
- No se usa un ORM para crear o migrar el esquema.

## Alternativas consideradas

- **MySQL.** Es el ejemplo del enunciado y también serviría. Se elige PostgreSQL por ser una opción directa y por sus restricciones `CHECK`, que permiten validar reglas en la propia base.
- **ORM con migraciones desde la aplicación.** Ata el esquema al lenguaje de la aplicación y hace que la imagen de la base de datos deje de ser autónoma, que es justo lo que pide el enunciado.

## Consecuencias

- El esquema no depende del lenguaje de la aplicación: si la aplicación cambiara de lenguaje, la base de datos no cambia.
- Los scripts de inicialización solo corren con el volumen vacío: durante el desarrollo, un cambio de esquema requiere `docker compose down -v`.
- No hay migraciones incrementales. Es una limitación aceptada para este alcance.
