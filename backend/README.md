# Backend (API REST)

Aquí va la API del catálogo. **El lenguaje y el framework los elige quien lo desarrolle** ([ADR-0009](../docs/adr/0009-stack-del-backend.md)). Lo que no es negociable es el contrato y lo que sigue.

## Qué hay que construir

Los endpoints y sus formatos están en [`docs/api/openapi.yaml`](../docs/api/openapi.yaml). Resumen:

| Método y ruta | Éxito | Qué hace |
|---|---|---|
| `GET /health` | 200 | `200` si la API puede consultar la base de datos, `503` si no |
| `GET /api/v1/aplicaciones` | 200 | Lista con datos básicos y `total_despliegues`. Búsqueda por nombre con `q` |
| `POST /api/v1/aplicaciones` | 201 | Crea una aplicación |
| `POST /api/v1/aplicaciones/lote` | 201 | Carga masiva, todo o nada |
| `GET /api/v1/aplicaciones/{id}` | 200 | Detalle con sus despliegues (JOIN) |
| `GET /api/v1/aplicaciones/{id}/despliegues` | 200 | Lista los despliegues de una aplicación |
| `POST /api/v1/aplicaciones/{id}/despliegues` | 201 | Crea un despliegue (como máximo uno por ambiente) |

La base es **crear y consultar**. Editar y eliminar quedan como incremento, si el grupo lo decide ([pendientes.md](../docs/pendientes.md), #11).

Un despliegue es el **estado actual** de una aplicación en un ambiente: hay como máximo uno por aplicación y ambiente (de 0 a 3), sin historial ([ADR-0004](../docs/adr/0004-modelo-de-datos-del-catalogo.md)). Por ahora un despliegue se crea y no se edita.

**Prioridad si el tiempo aprieta:** primero `health`, listar, detalle y crear (individual y masiva).

## Errores

Todos los errores usan el formato de [`docs/errores.md`](../docs/errores.md): mismos códigos, mismo JSON, incluidos los de rutas inexistentes y los inesperados. Allí están las reglas de negocio (R1 y R2), el orden de validación (incluido el de la carga masiva) y la traducción de errores de la base de datos, que distingue qué restricción `UNIQUE` falló.

## Arquitectura interna

Capas Controller, Service y Repository, con las responsabilidades de [arquitectura.md](../docs/arquitectura.md#4-capas-del-backend). Resumen: el controlador valida formato y traduce a HTTP; el servicio aplica las reglas de negocio y maneja la transacción; el repositorio solo habla SQL.

## Requisitos del contenedor

Hay que entregar un `backend/Dockerfile`. Con cualquier lenguaje deben cumplirse estos puntos:

1. **Escuchar en `0.0.0.0`**, no en `localhost`. Si escucha solo en `localhost`, dentro del contenedor nadie podrá conectarse, aunque el puerto esté publicado.
2. **Puerto:** el definido por la variable `PORT`, que Compose fija en `8080`.
3. **Todo por variables de entorno.** Ninguna credencial ni dirección va escrita en el código ni en la imagen.
4. **Terminar bien con `SIGTERM`.** `docker stop` envía `SIGTERM` y a los 10 s mata el proceso. Usar la forma *exec* de `CMD` para que la señal llegue a la aplicación. Compose ya pone `init: true` en `api`, así que la señal llega aunque el runtime la ignore como proceso 1 (le pasa a Node).
5. **Logs a la salida estándar**, para verlos con `docker logs`.
6. **Imagen liviana:** idealmente con *multi-stage build*, y un archivo `.dockerignore` que excluya dependencias locales y archivos de desarrollo.

### Plantillas de Dockerfile

En [`plantillas/`](plantillas/) hay un Dockerfile de partida por stack, ya probado: construye, corre sin `root`, escucha en `PORT` y se detiene al instante con `docker stop`. Cuando el grupo elija el stack:

```bash
cp backend/plantillas/Dockerfile.node backend/Dockerfile     # o .python, o .java
```

Luego ajustar las líneas marcadas con **AJUSTAR** (punto de entrada) y borrar la carpeta `plantillas/` y las líneas de `.dockerignore` que no apliquen.

| Plantilla | Supone | Imagen final de prueba |
|---|---|---|
| `Dockerfile.node` | `package.json`, `package-lock.json` y `src/index.js` | `node:24-alpine`, unos 250 MB |
| `Dockerfile.python` | `requirements.txt` y `app/main.py` con el objeto `app` (FastAPI con uvicorn) | `python:3.13-slim`, unos 220 MB |
| `Dockerfile.java` | `pom.xml` y `src/` (Spring Boot); `server.port=${PORT:8080}` en `application.properties` | `eclipse-temurin:21-jre-alpine`, unos 330 MB |

## Variables de entorno

| Variable | Valor en Compose | Para qué |
|---|---|---|
| `PORT` | `8080` | Puerto de escucha |
| `DB_HOST` | `db` | Nombre del servicio de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL dentro de la red de Compose (fijo) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `catalogo`, `catalogo`, `catalogo_dev` | Credenciales de desarrollo |
| `MAX_BATCH_SIZE` | `100` | Tope de aplicaciones por carga masiva |

## Criterios de aceptación

- [ ] `docker compose up -d --build` levanta la API sin pasos manuales.
- [ ] `GET /health` responde `200`; con la base de datos detenida, `503`.
- [ ] Todos los endpoints cumplen el OpenAPI, y los errores cumplen `errores.md`.
- [ ] La carga masiva es todo o nada, con `indice` en el error, y respeta `MAX_BATCH_SIZE`.
- [ ] La carga masiva valida elemento por elemento, en orden: el primer error corta, se hace `ROLLBACK` y se reporta su `indice`.
- [ ] Las reglas R1 y R2 devuelven `422`.
- [ ] Un nombre duplicado devuelve `409` con `campo: nombre`; en un lote, en el `indice` de la segunda aparición.
- [ ] Un ambiente repetido para la misma aplicación devuelve `409` con `campo: ambiente`: al crear un despliegue y en la carga masiva (también si se repite dentro de una misma aplicación del lote).
- [ ] Ninguna respuesta expone trazas ni mensajes internos de la base de datos.
