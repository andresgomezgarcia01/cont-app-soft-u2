# ADR-0008: Persistencia con volumen nombrado

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

El sistema de archivos de un contenedor desaparece cuando el contenedor se elimina. La rúbrica de la actividad pide datos almacenados "de manera persistente" en un "sistema independiente", y que se demuestre en el video.

## Decisión

- La base de datos guarda sus datos en el **volumen nombrado `db_data`**, montado en `/var/lib/postgresql/data`.
- Los datos sobreviven a `docker compose down` y a eliminar el contenedor; se pierden con `docker compose down -v`, que es el modo explícito de "empezar de cero".

**Versión de PostgreSQL.** Con PostgreSQL 17 o anterior, el volumen se monta en `/var/lib/postgresql/data`. Desde PostgreSQL 18, la imagen oficial usa un directorio de datos específico de cada versión y declara el volumen en `/var/lib/postgresql`. Si se actualiza la imagen a 18 o superior, hay que cambiar la ruta de montaje en `docker-compose.yml`.

## Alternativas consideradas

- **Bind mount a una carpeta del repositorio.** Los permisos y el rendimiento varían entre Windows, macOS y Linux, y los archivos de la base de datos terminarían dentro del repositorio.
- **Sin volumen.** Los datos se pierden al eliminar el contenedor, lo que incumple el requisito de persistencia.

## Consecuencias

- Demostración para el video: crear datos, eliminar el contenedor de la base de datos, volver a levantarlo y comprobar que los datos siguen ahí.
- Los scripts de `initdb.d` no se vuelven a ejecutar sobre un volumen ya inicializado ([ADR-0002](0002-postgresql-con-scripts-sql.md)).
