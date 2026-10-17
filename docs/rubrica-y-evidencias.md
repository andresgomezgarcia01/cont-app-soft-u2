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

Los números de comando son los de [comandos.md](comandos.md).

| Requisito | Dónde se cumple | Qué mostrar en el video |
|---|---|---|
| Instalación de Docker Desktop y consola | n/a | El proceso de instalación y luego `docker --version` (comando 1) |
| Crear y eliminar una imagen y un contenedor | Comandos 7 (eliminar la imagen `hello-world`), 8 y 9 (crear y etiquetar la imagen propia), 10 a 14 (crear, arrancar, detener y eliminar un contenedor) y 15, 20 y 21 (ejecutar, matar y eliminar otro) | `docker rmi hello-world`, que borra la imagen de verdad (`Deleted`, no solo `Untagged`), `docker build`, `docker create`/`run` y `docker rm` |
| Al menos 30 comandos con su arquitectura y usos | [comandos.md](comandos.md): 35 comandos, 30 de ellos distintos | Todos los de la lista, explicando qué hace cada uno y qué componente interviene |
| Imagen de una base de datos relacional | [`db/Dockerfile`](../db/Dockerfile) | `docker build` (comando 8) y `docker images` |
| Dos tablas con al menos 7 columnas y tipos variados | [`db/schema.sql`](../db/schema.sql) | `db/schema.sql` en pantalla al construir la imagen, y `\dt` dentro del contenedor (comando 17) |
| Modelo entidad-relación y dependencia entre tablas | Modelo de datos en [arquitectura.md](arquitectura.md) y la clave foránea de `despliegue` en [`db/schema.sql`](../db/schema.sql) | La clave foránea en `schema.sql` y el detalle de una aplicación con sus despliegues en el navegador |
| Imagen de un servidor web | [`app/Dockerfile`](../app/Dockerfile). La imagen de `app` es el servidor web de la aplicación: Node.js atiende HTTP en el puerto 3000 | El recorrido por `docker-compose.yml` y `docker compose up -d --build` (comando 28) |
| Aplicación que se visualiza por web | Servicio `app` en `http://localhost:3000` | El navegador, después de `docker compose ps` (comando 29) |
| Ingreso de 15 datos y guardado en la base de datos | Alta por formulario y carga de un archivo CSV ([ADR-0006](adr/0006-carga-masiva-csv.md)). Los "15 datos" son **al menos 15 aplicaciones**, cada una con sus despliegues | Unas 2 altas por el formulario y un CSV de 15 aplicaciones ([`docs/datos/aplicaciones-video.csv`](datos/aplicaciones-video.csv)) por la carga masiva; mostrar en la lista que hay al menos 15 |
| Otro enlace que muestre lo que hay en la base de datos | Páginas de lista y de detalle | Navegar de la página de ingreso a la de lista y a un detalle |
| Sistema independiente y persistente | Servicio `db` con el volumen `db_data` | `docker compose exec db psql ...` (comando 32); la demostración de persistencia con el volumen `datos-demo` (comando 26); `docker compose down` conserva el volumen, `docker compose up -d` vuelve a levantar la aplicación con los datos y `down -v` los borra (comandos 33 a 35) |
| Todo dentro de contenedores | Servicios `db` y `app` de `docker-compose.yml` | `docker compose ps` (comando 29) y `docker network inspect catalogo-red` (comando 30), con `db` y `app` conectados a la red |
| Interfaz con estándares UX/UI | A criterio de quien desarrolla la aplicación | La interfaz durante la demostración en el navegador |

## 3. Orden sugerido del video

El enunciado no fija una duración. **Duración: unos 15 minutos**, a unos 15 a 20 segundos por comando. Orden, explicando cada paso en voz alta (las fases son las de [comandos.md](comandos.md)):

1. **Instalación de Docker Desktop** y fase 1: verificar el cliente, Compose y el daemon, y el primer contenedor.
2. **Imágenes** (fase 2): descargar, listar, eliminar `hello-world` de verdad, construir la imagen de la base de datos (explicando `db/Dockerfile`, `schema.sql` y la relación entre las dos tablas) y etiquetarla.
3. **Ciclo de vida** de un contenedor (fase 3): crear, arrancar, detener, eliminar y ejecutar con puerto publicado.
4. **Inspección y operación** (fase 4): logs, `exec` con las tablas, `inspect`, `stats`, `kill` y `rm`.
5. **Redes y volúmenes** (fase 5), con la demostración de persistencia del comando 26.
6. **Recorrido por `docker-compose.yml`**: servicios `db`, `seed` y `app`, variables y `.env`, puertos, `healthcheck` y `depends_on`, volumen y red, en relación con el diagrama de contenedores.
7. **Compose en marcha:** `config`, `up -d --build`, `ps`, `network inspect` (la red y sus contenedores) y `logs -f`. La base arranca **vacía**: no se carga el seed.
8. **La aplicación en el navegador:** lista vacía, unas 2 altas por formulario (con despliegues), la carga del CSV de 15 aplicaciones, la lista con al menos 15 y el detalle con sus despliegues.
9. **Evidencia independiente y cierre:** consulta directa con `psql`, `docker compose down` (los datos se conservan en el volumen), `docker compose up -d` (la aplicación vuelve con los datos cargados) y `docker compose down -v` (se borran).
10. **Conclusión:** ventajas de la contenerización vistas en las lecturas (portabilidad, aislamiento, eliminación del problema "funciona en mi máquina", un proceso por contenedor).

Reparto aproximado de minutos:

| Paso | Comandos | Minutos |
|---|---|---|
| 1 | Instalación y 1 a 4 (4) | 1,5 |
| 2 | 5 a 9 (5) | 1,5 |
| 3 | 10 a 15 (6) | 1,5 |
| 4 | 16 a 21 (6) | 1,5 |
| 5 | 22 a 26 (5), más la demostración de persistencia | 2 |
| 6 | Sin comandos: el archivo `docker-compose.yml` | 1,5 |
| 7 | 27 a 31 (5) | 1,5 |
| 8 | Sin comandos: la interfaz web | 2 |
| 9 | 32 a 35 (4), volviendo a abrir la aplicación | 1,5 |
| 10 | Sin comandos | 0,5 |
| **Total** | **35** | **15** |

## 4. Qué se entrega

Fecha de entrega: **martes 20 de octubre de 2026**. La hora de cierre hay que confirmarla en la plataforma.

- Código fuente de la aplicación web (`app/`).
- Script de la base de datos (`db/`: `schema.sql` y `seed/seed.sql`).
- Enlace al video, **compartido de forma pública**.

Indicaciones de la plataforma: no incluir datos personales; subir el archivo al menos **dos horas antes** del cierre; una vez enviado a calificar no se puede cambiar.

La entrega es **grupal, de 3 integrantes**.
