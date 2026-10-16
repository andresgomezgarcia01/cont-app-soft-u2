# Rúbrica y evidencias

Resumen de lo que evalúa la **Actividad Sumativa 2** y de qué evidencia aporta cada parte del proyecto. Está transcrito del PDF de la actividad: si hay alguna diferencia, manda la rúbrica oficial. Total: **170 puntos**, todos evaluados a través del video.

## 1. Criterios de la rúbrica

### Comandos Docker (70 puntos)

*Consulta y realiza al menos 30 comandos Docker en la consola mostrando su instalación.*

| Nivel | Puntos | Qué pide |
|---|---|---|
| Excelente | 70 | Instalación y **todos los comandos**, diferenciando su arquitectura y usos, en el video |
| Bueno | 45 | Instalación y todos los comandos, evidenciados en el video |
| Regular | 10 | Instalación y 20 comandos en el video |
| No aprueba | 5 | Instalación y 10 comandos en el video |

La diferencia entre 45 y 70 está en **explicar** la arquitectura y los usos, no solo ejecutar. Ver [comandos.md](comandos.md).

### Despliegue de aplicación web (70 puntos)

*Aplicación de uso web con almacenamiento de, al menos, 15 tipos de datos diferentes (entero, cadena, fecha, etc.) de manera persistente, con interfaz gráfica y diseño agradable.*

| Nivel | Puntos | Qué pide |
|---|---|---|
| Excelente | 70 | Aplicación web y base de datos desplegadas con Docker, con interfaz gráfica que cumple **todos los estándares UX/UI**, con el total de las variables especificadas y teniendo en cuenta la relación de las tablas |
| Bueno | 45 | Interfaz gráfica básica y se tiene en cuenta la relación de las tablas |
| Regular | 30 | Interfaz gráfica básica, pero no se tiene en cuenta la relación de las tablas |
| No aprueba | 15 | Sin interfaz gráfica y sin tener en cuenta la relación de las tablas |

### Pruebas (30 puntos)

| Nivel | Puntos | Qué pide |
|---|---|---|
| Excelente | 30 | Al menos **15 datos** almacenados de forma persistente en un **sistema independiente**; los muestra en el video **explicando claramente cada paso** |
| Bueno | 10 | Al menos 10 datos, mostrados en el video explicando cada paso |
| Regular | 5 | Al menos 10 datos, mostrados en el video, sin explicación de los pasos |
| No aprueba | 0 | Los datos no se pueden almacenar correctamente |

## 2. Requisitos del enunciado y dónde se cumplen

| Requisito | Dónde se cumple | Qué mostrar en el video |
|---|---|---|
| Instalación de Docker Desktop y consola | n/a | El proceso de instalación y luego `docker --version` |
| Crear y eliminar una imagen y un contenedor | Comandos 10 y 11 (crear y etiquetar la imagen), 13 a 21 (crear y eliminar contenedores) y 48 (eliminar la imagen `hello-world`) de [comandos.md](comandos.md) | `docker build`, `docker create`/`run`, `docker rm` y `docker rmi hello-world`, que borra la imagen de verdad (no solo una etiqueta) |
| Al menos 30 comandos con su arquitectura y usos | [comandos.md](comandos.md) | Los 30 marcados con ★, explicando el componente de cada uno |
| Imagen de una base de datos relacional | [`db/Dockerfile`](../db/Dockerfile) | `docker build` y `docker images` |
| Dos tablas con al menos 7 columnas y tipos variados | [`db/schema.sql`](../db/schema.sql) | `\d aplicacion` y `\d despliegue` dentro de `psql` |
| Modelo entidad-relación y dependencia entre tablas | [Modelo de datos](arquitectura.md#5-modelo-de-datos) | La clave foránea en `\d despliegue` y el detalle en la interfaz |
| Imagen de un servidor web | `frontend/Dockerfile` | `docker compose build` |
| Aplicación que se visualiza por web | Servicio `web` | El navegador en `http://localhost:3000` |
| Ingreso de 15 datos y guardado en la base de datos | Formulario y carga masiva ([ADR-0006](adr/0006-carga-masiva-json.md)). Los "15 datos" son **al menos 15 aplicaciones**, cada una con sus despliegues | Unas 2 altas por el formulario y un JSON de 15 aplicaciones por la carga masiva; mostrar en la lista que hay al menos 15 |
| Otro enlace que muestre lo que hay en la base de datos | Pantallas de lista y de detalle | Navegar de la pantalla de ingreso a la de lista |
| Sistema independiente y persistente | Servicio `db` con el volumen `db_data` | `docker compose exec db psql ...` con `SELECT` y `JOIN`, y luego `down`, `up` y los datos siguen |
| Todo dentro de contenedores | `docker-compose.yml` | `docker compose ps` y `docker ps` |
| Interfaz con estándares UX/UI | [`frontend/README.md`](../frontend/README.md) | Estados de carga, vacío y error; validación de formularios |

## 3. Orden sugerido del video

El enunciado no fija una duración. **Objetivo: de 10 a 15 minutos** (por confirmar con el grupo), a unos 15 a 20 segundos por comando. Orden propuesto, explicando cada paso en voz alta:

1. **Instalación de Docker Desktop** y comandos de las fases 1 y 2.
2. **Ciclo de vida** de un contenedor (fase 3), inspección (fase 4) y redes y volúmenes (fase 5), con la demostración de persistencia del comando 37.
3. **Imagen de la base de datos:** `docker build`, `schema.sql`, y la relación entre las dos tablas.
4. **`docker compose up`:** servicios, `healthcheck` y orden de arranque. La base arranca **vacía**: no se carga el seed.
5. **La aplicación:** lista, detalle (relación), alta por formulario y carga masiva hasta tener al menos 15 aplicaciones (unas 2 por formulario y un JSON de 15).
6. **Evidencia independiente** de la aplicación: consulta directa a la base de datos con `psql`.
7. **Persistencia:** `docker compose down`, `docker compose up` y los datos siguen ahí.
8. **Limpieza y cierre:** `docker compose down -v` y `docker rmi hello-world`; ventajas de la contenerización vistas en las lecturas (portabilidad, aislamiento, eliminación del problema "funciona en mi máquina", un proceso por contenedor).

Reparto aproximado de minutos (los números de comando son los de [comandos.md](comandos.md)):

| Paso | Comandos ★ | Minutos |
|---|---|---|
| 1 | 1 a 4, 6, 7, 10 y 11 (8) | 2 a 3 |
| 2 | 13 a 15, 17 a 24, 29, 31, 34 y 37 (15), más la demostración de persistencia | 4 a 5 |
| 3 | Sin comandos nuevos: explicar `schema.sql` y la relación | 0,5 |
| 4 | 40 a 43 (4) | 1 a 1,5 |
| 5 | Sin comandos: la interfaz web | 2 a 2,5 |
| 6 | Consulta con `psql` (el comando 43 u otra consulta con `JOIN`) | 0,5 |
| 7 | 46 (1), y volver a subir con el 40 | 0,5 a 1 |
| 8 | 47 y 48 (2) | 0,5 a 1 |
| **Total** | **30** | **11 a 15** |

## 4. Qué se entrega

Fecha de entrega: **martes 20 de octubre de 2026**. La hora de cierre hay que confirmarla en la plataforma.

- Código fuente de la aplicación web (`backend/` y `frontend/`).
- Script de la base de datos (`db/schema.sql` y `db/seed/seed.sql`).
- Enlace al video, **compartido de forma pública**.

Indicaciones de la plataforma: no incluir datos personales; subir el archivo al menos **dos horas antes** del cierre; una vez enviado a calificar no se puede cambiar.

La entrega es **grupal, de 3 integrantes**.
