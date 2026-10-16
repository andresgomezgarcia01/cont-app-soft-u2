# Catálogo de aplicaciones

Aplicación web contenerizada con Docker que mantiene un catálogo de aplicaciones y los lugares donde están desplegadas. Es la entrega de la **Actividad Sumativa 2 (Unidad 2: Contenedores)** del módulo *Contenerización de Aplicaciones de Software*.

El objetivo de fondo es mostrar las ventajas de la contenerización: cada componente corre en su propio contenedor y todo el entorno se levanta, en cualquier máquina, con un solo comando.

## Qué hace la aplicación

- Lista las aplicaciones con sus datos básicos, con búsqueda por nombre.
- Muestra el detalle de una aplicación junto con sus despliegues (aquí se ve la relación entre las dos tablas).
- Permite crear aplicaciones y despliegues, y consultarlos.
- Permite cargar varias aplicaciones de una vez pegando un JSON.

## Arranque rápido

Requisitos: Docker Desktop, o Docker Engine con el plugin Compose v2.

```bash
git clone https://github.com/andresgomezgarcia01/cont-app-soft-u2.git
cd cont-app-soft-u2
docker compose up -d --build
```

| Qué | Dónde |
|---|---|
| Interfaz web | http://localhost:3000 |
| API | http://localhost:8080 (estado en `/health`), para probar el backend por separado |
| Base de datos | No se publica en la máquina. Se consulta con `docker compose exec db psql -U catalogo -d catalogo` |

La interfaz llama a la API a través de `web`: su servidor web reenvía `/api/` al contenedor `api`. El navegador solo habla con `http://localhost:3000`.

La base de datos arranca **vacía**: `docker compose up` crea las tablas pero no carga datos.

**Datos base (opcional).** Para desarrollo local se pueden cargar unas aplicaciones de ejemplo con `docker compose run --rm seed` (o `make seed`). Levanta la base si hace falta, carga `db/seed/seed.sql` y borra su contenedor al terminar. Es idempotente: se puede repetir sin duplicar datos. No se usa en el video.

Para apagar:

```bash
docker compose down        # apaga y conserva los datos
docker compose down -v     # apaga y BORRA los datos
```

No hace falta crear un `.env`: los valores por defecto están en `docker-compose.yml`. Para cambiarlos, copiar `.env.example` a `.env`.

> **Mientras no exista `backend/Dockerfile`**, `docker compose up` falla al construir la API. Se crea copiando la plantilla del stack elegido desde `backend/plantillas/` (ver [backend/README.md](backend/README.md#plantillas-de-dockerfile)). Mientras tanto:
> - La base de datos se levanta sola con `docker compose up -d --build db`; si se quieren datos, `docker compose run --rm seed`. Para revisar: `docker compose exec db psql -U catalogo -d catalogo -c "SELECT * FROM aplicacion;"`.
> - El frontend se levanta sin la API con `docker compose up -d --build --no-deps web` (en `/api/` responde `502` hasta que exista la API).

El archivo `Makefile` ofrece atajos (`make up`, `make up-db`, `make seed`, `make down`, `make reset`...). Cada atajo imprime el comando Docker real que ejecuta. Para ver la lista: `make help`.

## Servicios

| Servicio | Rol | Puerto del contenedor | Puerto en la máquina |
|---|---|---|---|
| `db` | PostgreSQL con el esquema incluido en la imagen | 5432 | No se publica |
| `seed` | Job a pedido: carga los datos base y termina. `docker compose up` no lo ejecuta; se lanza con `docker compose run --rm seed` | no aplica | no aplica |
| `api` | API REST (backend) | 8080 | 8080 |
| `web` | Interfaz web (frontend). Reenvía `/api/` a `api` | 80 | 3000 |

## Estructura del repositorio

```text
cont-app-soft-u2/
  README.md               este documento
  docker-compose.yml      orquestación de los servicios (db, api, web y el job seed)
  .env.example            variables configurables (opcional)
  Makefile                atajos de uso diario
  db/
    Dockerfile            imagen de la base de datos (PostgreSQL + esquema)
    schema.sql            tablas, claves y restricciones
    seed/seed.sql         datos base a pedido (idempotente)
  backend/                API REST (ver backend/README.md)
    plantillas/           Dockerfile de partida para Node, Python y Java
  frontend/               interfaz web (ver frontend/README.md)
    Dockerfile            imagen de nginx con la interfaz
    nginx.conf            sirve la interfaz y reenvía /api/ a la API
  docs/                   documentación del proyecto
```

## Documentación

| Documento | Para qué sirve |
|---|---|
| [docs/arquitectura.md](docs/arquitectura.md) | Visión general: contenedores, capas, modelo de datos y flujos |
| [docs/adr/](docs/adr/README.md) | Decisiones de arquitectura y el porqué de cada una |
| [docs/api/openapi.yaml](docs/api/openapi.yaml) | Contrato de la API, compartido por backend y frontend |
| [docs/errores.md](docs/errores.md) | Formato y códigos de error que debe usar toda la API |
| [docs/comandos.md](docs/comandos.md) | Guion de los comandos Docker para el video |
| [docs/rubrica-y-evidencias.md](docs/rubrica-y-evidencias.md) | Qué evalúa la actividad y qué evidencia entrega cada parte |
| [docs/pendientes.md](docs/pendientes.md) | Preguntas abiertas y decisiones del grupo por tomar |

## Estado actual

| Parte | Estado |
|---|---|
| Base de datos (`schema.sql`, `seed.sql`, `db/Dockerfile`) | Lista y probada en Docker con `postgres:17-alpine`: crea las tablas en el primer arranque, `db` queda *healthy*, el seed a pedido es idempotente, las restricciones rechazan los datos inválidos y los datos sobreviven a `down` y `up`. El esquema puede cambiar según [pendientes.md](docs/pendientes.md) #17. |
| Contrato de la API (`openapi.yaml`) | Definido y validado como OpenAPI 3.0.3. |
| `docker-compose.yml` | Probado en Docker de punta a punta con una API de prueba: orden de arranque, reenvío de `web` a `api`, `502` con la API caída y `down` sin esperas. |
| Backend | Plantillas de Dockerfile listas y probadas (Node, Python y Java). Falta elegir el stack ([ADR-0009](docs/adr/0009-stack-del-backend.md)) y la implementación. |
| Frontend | `Dockerfile` y `nginx.conf` listos y probados. Falta elegir el framework ([ADR-0010](docs/adr/0010-stack-del-frontend.md)) y la interfaz. |
| Video | Pendiente |

## Reglas del equipo

1. **El contrato manda.** Backend y frontend se construyen contra `docs/api/openapi.yaml` y `docs/errores.md`. Si hace falta cambiarlos, se avisa al grupo y se actualizan los documentos en el mismo cambio.
2. **El esquema vive en la base de datos.** Los cambios a las tablas se hacen en `db/schema.sql`, no desde el backend.
3. **Está listo cuando es reproducible.** Cada integrante debe poder clonar el repositorio, ejecutar `docker compose up -d --build` y obtener el mismo resultado, sin pasos manuales adicionales.
4. **Nada de datos personales ni credenciales reales** en el repositorio ni en el video.
