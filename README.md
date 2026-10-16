# Catálogo de aplicaciones

Aplicación web contenerizada con Docker que mantiene un catálogo de aplicaciones y los lugares donde están desplegadas. Es la entrega de la **Actividad Sumativa 2 (Unidad 2: Contenedores)** del módulo *Contenerización de Aplicaciones de Software*.

El objetivo de fondo es mostrar las ventajas de la contenerización: cada componente corre en su propio contenedor y todo el entorno se levanta, en cualquier máquina, con un solo comando.

## Qué hace la aplicación

- Lista las aplicaciones con sus datos básicos, con filtros por origen y modalidad.
- Muestra el detalle de una aplicación junto con sus despliegues (aquí se ve la relación entre las dos tablas).
- Permite crear, editar y eliminar aplicaciones y despliegues.
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
| API | http://localhost:8080 (estado en `/health`) |
| Base de datos | `localhost:5432` (solo accesible desde la propia máquina) |

Para apagar:

```bash
docker compose down        # apaga y conserva los datos
docker compose down -v     # apaga y BORRA los datos
```

No hace falta crear un `.env`: los valores por defecto están en `docker-compose.yml`. Para cambiarlos, copiar `.env.example` a `.env`.

> **Mientras no existan `backend/Dockerfile` y `frontend/Dockerfile`**, `docker compose up` falla al construir la API y el frontend. La parte de datos sí se puede levantar sola con `docker compose up -d db seed` y revisar con
> `docker compose exec db psql -U catalogo -d catalogo -c "SELECT * FROM aplicacion;"`.

El archivo `Makefile` ofrece atajos (`make up`, `make down`, `make reset`...). Cada atajo imprime el comando Docker real que ejecuta. Para ver la lista: `make help`.

## Servicios

| Servicio | Rol | Puerto del contenedor | Puerto en la máquina |
|---|---|---|---|
| `db` | PostgreSQL con el esquema incluido en la imagen | 5432 | 5432 (solo localhost) |
| `seed` | Job de ejecución única: carga los datos base y termina | no aplica | no aplica |
| `api` | API REST (backend) | 8080 | 8080 |
| `web` | Interfaz web (frontend) | 80 | 3000 |

## Estructura del repositorio

```text
cont-app-soft-u2/
  README.md               este documento
  docker-compose.yml      orquestación de los cuatro servicios
  .env.example            variables configurables (opcional)
  Makefile                atajos de uso diario
  db/
    Dockerfile            imagen de la base de datos (PostgreSQL + esquema)
    schema.sql            tablas, claves y restricciones
    seed/seed.sql         datos base (idempotente)
  backend/                API REST (ver backend/README.md)
  frontend/               interfaz web (ver frontend/README.md)
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
| Base de datos (`schema.sql`, `seed.sql`, `db/Dockerfile`) | Definida. Probada contra PostgreSQL 16: crea las tablas, el seed es idempotente y las restricciones rechazan los datos inválidos. Falta probar la imagen `postgres:17-alpine` dentro de Docker. |
| Contrato de la API (`openapi.yaml`) | Definido y validado como OpenAPI 3.0.3. |
| `docker-compose.yml` | Validado con `docker compose config`. Falta ejecutarlo. |
| Backend | Pendiente |
| Frontend | Pendiente |
| Video | Pendiente |

## Reglas del equipo

1. **El contrato manda.** Backend y frontend se construyen contra `docs/api/openapi.yaml` y `docs/errores.md`. Si hace falta cambiarlos, se avisa al grupo y se actualizan los documentos en el mismo cambio.
2. **El esquema vive en la base de datos.** Los cambios a las tablas se hacen en `db/schema.sql`, no desde el backend.
3. **Está listo cuando es reproducible.** Cada integrante debe poder clonar el repositorio, ejecutar `docker compose up -d --build` y obtener el mismo resultado, sin pasos manuales adicionales.
4. **Nada de datos personales ni credenciales reales** en el repositorio ni en el video.
