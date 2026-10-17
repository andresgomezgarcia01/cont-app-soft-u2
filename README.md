# Catálogo de aplicaciones

Aplicación web contenerizada con Docker que mantiene un catálogo de aplicaciones y los lugares donde están desplegadas. Es la entrega de la **Actividad Sumativa 2 (Unidad 2: Contenedores)** del módulo *Contenerización de Aplicaciones de Software*.

El objetivo de fondo es mostrar las ventajas de la contenerización: cada componente corre en su propio contenedor y todo el entorno se levanta, en cualquier máquina, con un solo comando.

## Qué hace la aplicación

- Lista las aplicaciones con sus datos básicos, con búsqueda por nombre.
- Muestra el detalle de una aplicación junto con sus despliegues (aquí se ve la relación entre las dos tablas).
- Permite crear aplicaciones y despliegues desde formularios, y consultarlos.
- Permite cargar varias aplicaciones de una vez subiendo un archivo CSV.

Es una aplicación en Node.js que arma las páginas en el servidor y guarda los datos en PostgreSQL. Se abre en el navegador, en `http://localhost:3000`.

## Servicios

| Servicio | Qué es | Puerto en el contenedor | Puerto en la máquina |
|---|---|---|---|
| `db` | La base de datos PostgreSQL, con las tablas incluidas en su imagen (`catalogo-db:1.0`) | 5432 | `127.0.0.1:5432`, solo para desarrollo local |
| `seed` | Un trabajo a pedido que carga datos de ejemplo y termina. `docker compose up` no lo ejecuta | no aplica | no aplica |
| `app` | La aplicación del catálogo (`catalogo-app:1.0`) | 3000 | 3000: `http://localhost:3000` |

La imagen de `app` es el servidor web de la aplicación: Node.js atiende HTTP en el puerto 3000. Los tres servicios comparten la red `catalogo-red` y se encuentran por su nombre: `app` se conecta a `db`.

## Paso a paso

Cada fase dice qué hace, el comando exacto y qué se debería ver. Los comandos se escriben en una terminal (PowerShell en Windows, Terminal en macOS o Linux), dentro de la carpeta del repositorio.

### Fase 1. Tener Docker listo

Hace falta **Docker Desktop instalado y abierto** (en Linux, Docker Engine con el plugin Compose v2). Antes de seguir, comprobar que responde:

```bash
docker --version
docker compose version
```

**Qué se debería ver:** una línea con la versión de cada uno. Si aparece un error de conexión, Docker Desktop no está abierto (ver [Problemas frecuentes](#problemas-frecuentes)).

### Fase 2. Descargar el proyecto

```bash
git clone https://github.com/andresgomezgarcia01/cont-app-soft-u2.git
cd cont-app-soft-u2
```

**Configuración (opcional).** No hace falta crear un `.env`: los valores por defecto están en `docker-compose.yml`. Solo si se quiere cambiar algo (por ejemplo, un puerto ocupado), se copia la plantilla y se edita:

```bash
cp .env.example .env
```

**Qué se debería ver:** la carpeta `cont-app-soft-u2` con `docker-compose.yml`, `app/`, `db/` y `docs/`.

### Fase 3. Construir las imágenes

```bash
docker compose build
```

Construye las dos imágenes propias: la de la base de datos (`db/Dockerfile`) y la de la aplicación (`app/Dockerfile`). `seed` no se construye: usa la imagen oficial de PostgreSQL.

**Qué se debería ver:** el avance de cada paso de los `Dockerfile` y, al final, una línea `Built` para `db` y otra para `app`. Con `docker images` aparecen `catalogo-db` y `catalogo-app`, con la etiqueta `1.0`.

### Fase 4. Levantar solo la base de datos

```bash
docker compose up -d db
docker compose ps
docker compose logs db
```

Arranca solo la base, en segundo plano (`-d`). La primera vez crea las tablas.

**Qué se debería ver:**

- en `docker compose ps`, el contenedor `catalogo-apps-db-1` con estado `Up` y, a los pocos segundos, `(healthy)`;
- en los logs, `database system is ready to accept connections`.

Desde la máquina, la base queda en `localhost:5432` (usuario `catalogo`, contraseña `catalogo_dev`, base `catalogo`). Sirve para desarrollar la aplicación sin contenedor ([app/README.md](app/README.md)) o para conectarse con un cliente SQL.

### Fase 5. Cargar datos de ejemplo (opcional)

```bash
docker compose run --rm seed
```

Carga 4 aplicaciones y 6 despliegues de ejemplo, y borra su contenedor al terminar. Si la base no estaba levantada, la levanta y espera a que esté sana. Se puede repetir sin duplicar datos. No se usa en el video: allí la base arranca vacía.

**Qué se debería ver:** `BEGIN`, `INSERT 0 4`, `INSERT 0 6` y `COMMIT`. Si se repite, `INSERT 0 0`: los datos ya estaban.

### Fase 6. Levantar todo el entorno

```bash
docker compose up -d --build
docker compose ps
```

Construye lo que haya cambiado y levanta `db` y `app`. `app` espera a que la base esté sana antes de arrancar.

**Qué se debería ver:** en `docker compose ps`, `catalogo-apps-db-1` y `catalogo-apps-app-1` `(healthy)` (los primeros segundos, `app` puede mostrar `(health: starting)`). Abrir en el navegador:

- `http://localhost:3000`: la aplicación (mientras no esté desarrollada, responde `Cannot GET /`: es lo esperado);
- `http://localhost:3000/health`: `{"estado":"ok"}`, que indica que la aplicación llega a la base.

La base de datos arranca **vacía**: `docker compose up` crea las tablas pero no carga datos (para eso, la fase 5).

### Fase 7. Ver los logs

```bash
docker compose logs -f app
```

Muestra los mensajes de la aplicación en vivo (`-f`). `Ctrl+C` deja de mostrarlos sin detener nada. Para ver los de todos los servicios: `docker compose logs -f`.

**Qué se debería ver:** `Catálogo de aplicaciones escuchando en el puerto 3000` y, después, los mensajes de cada petición o error.

### Fase 8. Consultar la base de datos directamente

```bash
docker compose exec db psql -U catalogo -d catalogo
```

Abre la consola de PostgreSQL dentro del contenedor `db`. Allí, `\dt` lista las tablas, `SELECT nombre FROM aplicacion;` muestra los datos y `\q` sale. Para una sola consulta, sin entrar:

```bash
docker compose exec db psql -U catalogo -d catalogo -c "SELECT count(*) FROM aplicacion;"
```

**Qué se debería ver:** con `\dt`, las tablas `aplicacion` y `despliegue`.

### Fase 9. Apagar

```bash
docker compose down
```

Detiene y elimina los contenedores y la red. **Los datos se conservan** en el volumen: al volver a levantar, siguen ahí.

**Qué se debería ver:** `Removed` para cada contenedor y para la red `catalogo-red`.

```bash
docker compose down -v
```

Hace lo mismo y además **borra los datos** (elimina el volumen).

**Qué se debería ver:** además, `Removed` para el volumen `catalogo-apps_db_data`.

### Fase 10. Empezar de cero después de cambiar `schema.sql`

Las tablas se crean **solo la primera vez**, cuando el volumen está vacío. Si se cambia `db/schema.sql`, hay que borrar el volumen para que se vuelvan a crear:

```bash
docker compose down -v
docker compose up -d --build
docker compose logs db
```

**Qué se debería ver:** en los logs de `db`, `running /docker-entrypoint-initdb.d/01-schema.sql` y `PostgreSQL init process complete`. Los datos anteriores se pierden.

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `error during connect` o `Cannot connect to the Docker daemon` | Docker Desktop no está abierto | Abrirlo y esperar a que indique que el motor está corriendo. Repetir el comando |
| `port is already allocated` o `address already in use` con el 5432 | Hay otro PostgreSQL usando ese puerto en la máquina | En `.env`, `DB_PORT=5433` (u otro libre) y volver a levantar. La aplicación local también debe usar ese puerto ([app/README.md](app/README.md)) |
| Lo mismo con el 3000 | Otro programa usa ese puerto | En `.env`, `APP_PORT=3001` y abrir `http://localhost:3001` |
| Faltan tablas o columnas, o no se ven los cambios de `schema.sql` | El volumen es de antes del cambio: las tablas solo se crean con el volumen vacío | Fase 10 |
| `http://localhost:3000/health` responde `503` | La aplicación no llega a la base | `docker compose ps` para ver si `db` está `(healthy)` y `docker compose logs db` para ver por qué no |
| La lista sale vacía | Es lo esperado: la base arranca sin datos | Cargar datos desde la aplicación o con la fase 5 |

## Estructura del repositorio

```text
cont-app-soft-u2/
  README.md               este documento
  docker-compose.yml      los servicios (db, app y el trabajo seed), la red y el volumen
  .env.example            variables configurables (opcional)
  app/                    la aplicación (ver app/README.md)
    Dockerfile            imagen de la aplicación: el servidor web (Node.js)
    package.json          dependencias
    src/index.js          punto de entrada (por ahora, el único archivo de código; las capas se crean al desarrollar)
  db/
    Dockerfile            imagen de la base de datos (PostgreSQL + esquema)
    schema.sql            tablas, claves y restricciones
    seed/seed.sql         datos de ejemplo a pedido (idempotente)
  docs/                   documentación del proyecto
    adr/                  decisiones de arquitectura
    datos/                archivos CSV de ejemplo para la carga
```

## Documentación

| Documento | Para qué sirve |
|---|---|
| [docs/arquitectura.md](docs/arquitectura.md) | Visión general: contenedores, red, capas, modelo de datos y flujos |
| [docs/adr/](docs/adr/README.md) | Decisiones de arquitectura y el porqué de cada una |
| [app/README.md](app/README.md) | Especificación de la aplicación: páginas, formularios, carga del CSV, capas y cómo desarrollarla |
| [docs/errores.md](docs/errores.md) | Códigos de error de la aplicación y cómo se muestran |
| [docs/datos/](docs/datos/) | Archivos CSV de ejemplo: la plantilla y las 15 aplicaciones del video |
| [docs/comandos.md](docs/comandos.md) | Guion de los comandos Docker para el video |
| [docs/rubrica-y-evidencias.md](docs/rubrica-y-evidencias.md) | Qué evalúa la actividad y qué evidencia entrega cada parte |
| [docs/pendientes.md](docs/pendientes.md) | Pendientes y decisiones tomadas |

## Estado actual

| Parte | Estado |
|---|---|
| Aplicación (`app/`) | Esqueleto mínimo: un solo archivo (`src/index.js`) que arranca, responde `/health` y cierra ordenadamente, con su `Dockerfile`. Falta todo el desarrollo: las capas, las páginas, los formularios, el manejo de errores y la carga del CSV ([app/README.md](app/README.md)). |
| Base de datos (`schema.sql`, `seed.sql`, `db/Dockerfile`) | Verificada en Docker con `postgres:17-alpine`: crea las tablas en el primer arranque, `db` queda *healthy*, el seed a pedido es idempotente, las restricciones rechazan los datos inválidos y los datos sobreviven a `down` y `up`. |
| `docker-compose.yml` | Cambió: servicio `app`, red `catalogo-red` y el 5432 publicado en `127.0.0.1`. Falta verificar en Docker el servicio `app` y la red nueva. |
| Video | Pendiente |

## Reglas del equipo

1. **Los errores y el modelo mandan.** La aplicación sigue `docs/errores.md` y `db/schema.sql`. Si hace falta cambiarlos, se avisa al grupo y se actualizan los documentos en el mismo cambio.
2. **El esquema vive en la base de datos.** Los cambios a las tablas se hacen en `db/schema.sql`, no desde la aplicación.
3. **Está listo cuando es reproducible.** Cada integrante debe poder clonar el repositorio, ejecutar `docker compose up -d --build` y obtener el mismo resultado, sin pasos manuales adicionales.
4. **Nada de datos personales ni credenciales reales** en el repositorio ni en el video.
