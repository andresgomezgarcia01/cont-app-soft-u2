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
| Crear y eliminar una imagen y un contenedor | Comandos 10, 11, 13 a 21 y 48 de [comandos.md](comandos.md) | `docker build`, `docker create`/`run`, `docker rm`, `docker rmi` |
| Al menos 30 comandos con su arquitectura y usos | [comandos.md](comandos.md) | Los 30 marcados con ★, explicando el componente de cada uno |
| Imagen de una base de datos relacional | [`db/Dockerfile`](../db/Dockerfile) | `docker build` y `docker images` |
| Dos tablas con 7 columnas y tipos variados | [`db/schema.sql`](../db/schema.sql) | `\d aplicacion` y `\d despliegue` dentro de `psql` |
| Modelo entidad-relación y dependencia entre tablas | [Modelo de datos](arquitectura.md#5-modelo-de-datos) | La clave foránea en `\d despliegue` y el detalle en la interfaz |
| Imagen de un servidor web | `frontend/Dockerfile` | `docker compose build` |
| Aplicación que se visualiza por web | Servicio `web` | El navegador en `http://localhost:3000` |
| Ingreso de 15 datos y guardado en la base de datos | Formulario y carga masiva ([ADR-0006](adr/0006-carga-masiva-json.md)) | Dos o tres altas por el formulario y el resto pegando un JSON; contar hasta 15 |
| Otro enlace que muestre lo que hay en la base de datos | Pantallas de lista y de detalle | Navegar de la pantalla de ingreso a la de lista |
| Sistema independiente y persistente | Servicio `db` con el volumen `db_data` | `docker compose exec db psql ...` con `SELECT` y `JOIN`, y luego `down`, `up` y los datos siguen |
| Todo dentro de contenedores | `docker-compose.yml` | `docker compose ps` y `docker ps` |
| Interfaz con estándares UX/UI | [`frontend/README.md`](../frontend/README.md) | Estados de carga, vacío y error; validación de formularios |

## 3. Orden sugerido del video

El enunciado no fija una duración. Orden propuesto, explicando cada paso en voz alta:

1. **Instalación de Docker Desktop** y comandos de las fases 1 y 2.
2. **Ciclo de vida** de un contenedor (fase 3), inspección (fase 4) y redes y volúmenes (fase 5).
3. **Imagen de la base de datos:** `docker build`, `schema.sql`, y la relación entre las dos tablas.
4. **`docker compose up`:** servicios, `healthcheck`, orden de arranque y el job de seed.
5. **La aplicación:** lista, detalle (relación), alta por formulario y carga masiva hasta los 15 datos.
6. **Evidencia independiente** de la aplicación: consulta directa a la base de datos con `psql`.
7. **Persistencia:** `docker compose down`, `docker compose up` y los datos siguen ahí.
8. **Cierre:** ventajas de la contenerización vistas en las lecturas (portabilidad, aislamiento, eliminación del problema "funciona en mi máquina", un proceso por contenedor).

## 4. Qué se entrega

- Código fuente de la aplicación web (`backend/` y `frontend/`).
- Script de la base de datos (`db/schema.sql` y `db/seed/seed.sql`).
- Enlace al video, **compartido de forma pública**.

Indicaciones de la plataforma: no incluir datos personales; subir el archivo al menos **dos horas antes** del cierre; una vez enviado a calificar no se puede cambiar; la entrega es individual o grupal según indique el tutor.

## 5. Propuesta de cronograma

La entrega es el martes 20 de octubre (confirmar la hora de cierre en la plataforma). Propuesta:

| Cuándo | Qué |
|---|---|
| Sábado | Backend y frontend con lo mínimo funcionando contra el contrato (lista, detalle, alta) |
| Domingo | Integración con Compose, carga masiva, pulido de la interfaz |
| Lunes | Ensayo y grabación del video; ajustes |
| Martes (mañana) | Entrega, con margen de al menos dos horas antes del cierre |
