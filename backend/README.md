# Backend (API REST)

Aquí va la API del catálogo. **El lenguaje y el framework los elige quien lo desarrolle** ([ADR-0009](../docs/adr/0009-stack-del-backend.md)). Lo que no es negociable es el contrato y lo que sigue.

## Qué hay que construir

Los endpoints y sus formatos están en [`docs/api/openapi.yaml`](../docs/api/openapi.yaml). Resumen:

| Método y ruta | Éxito | Qué hace |
|---|---|---|
| `GET /health` | 200 | `200` si la API puede consultar la base de datos, `503` si no |
| `GET /api/v1/aplicaciones` | 200 | Lista con datos básicos y `total_despliegues`. Filtros: `origen`, `modalidad`, `activa`, `q` |
| `POST /api/v1/aplicaciones` | 201 | Crea una aplicación |
| `POST /api/v1/aplicaciones/lote` | 201 | Carga masiva, todo o nada |
| `GET /api/v1/aplicaciones/{id}` | 200 | Detalle con sus despliegues (JOIN) |
| `PUT /api/v1/aplicaciones/{id}` | 200 | Reemplaza los datos de una aplicación |
| `DELETE /api/v1/aplicaciones/{id}` | 204 | Elimina la aplicación y, en cascada, sus despliegues |
| `GET /api/v1/aplicaciones/{id}/despliegues` | 200 | Lista los despliegues de una aplicación |
| `POST /api/v1/aplicaciones/{id}/despliegues` | 201 | Crea un despliegue |
| `PUT /api/v1/despliegues/{id}` | 200 | Reemplaza los datos de un despliegue |
| `DELETE /api/v1/despliegues/{id}` | 204 | Elimina un despliegue |

**Prioridad si el tiempo aprieta:** primero `health`, listar, detalle y crear (individual y masiva). Editar y eliminar después.

## Errores

Todos los errores usan el formato de [`docs/errores.md`](../docs/errores.md): mismos códigos, mismo JSON, incluidos los de rutas inexistentes y los inesperados. Allí están las reglas de negocio (R1, R2 y R3), el orden de validación y la traducción de errores de la base de datos.

## Arquitectura interna

Capas Controller, Service y Repository, con las responsabilidades de [arquitectura.md](../docs/arquitectura.md#4-capas-del-backend). Resumen: el controlador valida formato y traduce a HTTP; el servicio aplica las reglas de negocio y maneja la transacción; el repositorio solo habla SQL.

## Requisitos del contenedor

Hay que entregar un `backend/Dockerfile`. Con cualquier lenguaje deben cumplirse estos puntos:

1. **Escuchar en `0.0.0.0`**, no en `localhost`. Si escucha solo en `localhost`, dentro del contenedor nadie podrá conectarse, aunque el puerto esté publicado.
2. **Puerto:** el definido por la variable `PORT`, que Compose fija en `8080`.
3. **Todo por variables de entorno.** Ninguna credencial ni dirección va escrita en el código ni en la imagen.
4. **Terminar bien con `SIGTERM`.** `docker stop` envía `SIGTERM` y a los 10 s mata el proceso. La aplicación debería cerrar conexiones y salir; algunos entornos exigen que el proceso sea el principal del contenedor (usar la forma *exec* de `CMD`).
5. **Logs a la salida estándar**, para verlos con `docker logs`.
6. **Imagen liviana:** idealmente con *multi-stage build*, y un archivo `.dockerignore` que excluya dependencias locales y archivos de desarrollo.

## Variables de entorno

| Variable | Valor en Compose | Para qué |
|---|---|---|
| `PORT` | `8080` | Puerto de escucha |
| `DB_HOST` | `db` | Nombre del servicio de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `catalogo`, `catalogo`, `catalogo_dev` | Credenciales de desarrollo |
| `MAX_BATCH_SIZE` | `100` | Tope de aplicaciones por carga masiva |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen del frontend permitido. Sin CORS el navegador bloquea las llamadas |

## Criterios de aceptación

- [ ] `docker compose up -d --build` levanta la API sin pasos manuales.
- [ ] `GET /health` responde `200`; con la base de datos detenida, `503`.
- [ ] Todos los endpoints cumplen el OpenAPI, y los errores cumplen `errores.md`.
- [ ] La carga masiva es todo o nada, con `indice` en el error, y respeta `MAX_BATCH_SIZE`.
- [ ] Las reglas R1, R2 y R3 devuelven `422` (incluida R3 al cambiar el origen de una aplicación).
- [ ] Un nombre duplicado devuelve `409`.
- [ ] Ninguna respuesta expone trazas ni mensajes internos de la base de datos.
