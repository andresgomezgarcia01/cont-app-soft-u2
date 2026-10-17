# Guion de comandos Docker para el video

La rúbrica pide **al menos 30 comandos Docker en la consola, mostrando la instalación**, y para la nota máxima, **explicando su arquitectura y sus usos**. Este guion tiene **35 comandos**, en el orden en que se ejecutan en el video, y todos se usan. Algunos se repiten con otras opciones (`docker run`, `docker rm`, `docker compose up` y `docker compose down`): contando cada uno una sola vez, son **30 comandos distintos**.

Al ejecutar cada comando se dice qué hace y qué componente de Docker interviene. Este es el mapa:

```text
docker (CLI, el cliente) --API REST--> dockerd (daemon) --pull/push--> Registry (Docker Hub)
                                          |
                         administra: imágenes, contenedores, redes, volúmenes
```

- **Cliente:** el comando `docker` que se escribe en la consola. No hace el trabajo: se lo pide al daemon.
- **Daemon:** el servicio de Docker que construye imágenes y crea y ejecuta contenedores, redes y volúmenes.
- **Registry:** el almacén de imágenes (Docker Hub, por defecto), de donde se descargan.
- **Imagen:** la plantilla de solo lectura, hecha de capas. **Contenedor:** una instancia en ejecución de una imagen.
- **Red** y **volumen:** cómo se comunican los contenedores y dónde guardan los datos que deben sobrevivirles.
- **Compose:** describe en un archivo varios contenedores con su red y su volumen, y los maneja juntos.

Los nombres `db-demo`, `db-demo2`, `db-demo3`, `red-demo` y `datos-demo` son de práctica y no chocan con los de Compose.

## Fase 1. Instalación y verificación

Mostrar primero la instalación de Docker Desktop y luego abrir la consola.

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 1 | `docker --version` | Versión del cliente instalado | Cliente |
| 2 | `docker compose version` | Compose v2 viene como plugin del mismo cliente | Cliente, Compose |
| 3 | `docker info` | Estado del daemon: contenedores, imágenes, runtime y sistema operativo. Si responde, el cliente llega al daemon | Daemon |
| 4 | `docker run --rm hello-world` | Primer contenedor. El cliente se lo pide al daemon, que descarga la imagen del registry, crea el contenedor y lo ejecuta. `--rm` lo elimina al terminar | Cliente, daemon, registry, imagen, contenedor |

## Fase 2. Imágenes

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 5 | `docker pull postgres:17-alpine` | Descarga una imagen del registry. Cada línea de progreso es una **capa**. Es la base de la imagen propia de la base de datos | Registry, imagen |
| 6 | `docker images` | Lista las imágenes locales (equivale a `docker image ls`): se ven `hello-world` y `postgres` | Imagen |
| 7 | `docker rmi hello-world` | Elimina la imagen **de verdad**: `hello-world` no tiene otras etiquetas ni contenedores (el del comando 4 se borró con `--rm`), así que se borran sus capas. La salida termina en `Deleted: sha256:...`. Distinto es quitar una etiqueta: si la imagen tiene otras, `docker rmi` solo muestra `Untagged` y la imagen queda (pasaría con `docker rmi catalogo-db:latest` después del comando 9) | Imagen |
| 8 | `docker build -t catalogo-db:1.0 ./db` | Construye la imagen propia a partir de `db/Dockerfile`, que parte de `postgres:17-alpine` y le agrega `db/schema.sql` con las dos tablas. Es la "imagen de base de datos" que pide la actividad | Cliente, daemon, imagen |
| 9 | `docker tag catalogo-db:1.0 catalogo-db:latest` | Agrega una segunda etiqueta a la misma imagen (no la copia: tiene el mismo `IMAGE ID`) | Imagen |

## Fase 3. Ciclo de vida de un contenedor

Es el ciclo de vida de la lectura de la Unidad 2: creado, en ejecución, detenido y eliminado.

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 10 | `docker create --name db-demo -e POSTGRES_PASSWORD=demo catalogo-db:1.0` | Crea el contenedor **sin arrancarlo** (estado *Created*). `-e` le pasa una variable de entorno | Contenedor |
| 11 | `docker ps -a` | Lista todos los contenedores, también los creados o detenidos: `db-demo` aparece como *Created* | Contenedor |
| 12 | `docker start db-demo` | Inicia el contenedor ya creado | Contenedor |
| 13 | `docker stop db-demo` | Detención ordenada: envía `SIGTERM` y, si no termina en 10 s (valor por defecto), `SIGKILL` (ver nota 1) | Contenedor |
| 14 | `docker rm db-demo` | Elimina el contenedor. Debe estar detenido; si está en ejecución, da error (o se usa `-f`) | Contenedor |
| 15 | `docker run -d --name db-demo2 -e POSTGRES_PASSWORD=demo -p 5433:5432 catalogo-db:1.0` | `run` = `create` + `start` en un paso. `-d` lo deja en segundo plano y `-p 5433:5432` publica el puerto (máquina 5433, contenedor 5432) | Contenedor, red |

## Fase 4. Inspección y operación

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 16 | `docker logs --tail 20 db-demo2` | Salida estándar del contenedor. Con `-f` la sigue en vivo. Esperar a ver "ready to accept connections" después de "PostgreSQL init process complete" (ver nota 5) | Contenedor |
| 17 | `docker exec -it db-demo2 psql -U postgres -c "\dt"` | Ejecuta un comando dentro del contenedor en ejecución. Muestra las dos tablas, `aplicacion` y `despliegue`: **el esquema viene dentro de la imagen** | Contenedor |
| 18 | `docker inspect db-demo2` | Configuración y estado completos: IP, montajes, variables, puertos | Contenedor |
| 19 | `docker stats --no-stream` | Consumo de CPU y memoria de cada contenedor en ejecución. Sin `--no-stream` se actualiza en vivo | Contenedor |
| 20 | `docker kill db-demo2` | `SIGKILL` inmediato, sin limpieza. Contrastar con `stop` (ver nota 1) | Contenedor |
| 21 | `docker rm db-demo2` | Elimina el contenedor que se acaba de matar | Contenedor |

## Fase 5. Redes y volúmenes

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 22 | `docker network create red-demo` | Crea una red. En ella los contenedores se encuentran por nombre | Red |
| 23 | `docker network ls` | Lista las redes: las que trae Docker (`bridge`, `host`, `none`) y `red-demo` | Red |
| 24 | `docker volume create datos-demo` | Crea un volumen nombrado, gestionado por Docker | Volumen |
| 25 | `docker volume ls` | Lista los volúmenes | Volumen |
| 26 | `docker run -d --name db-demo3 --network red-demo -v datos-demo:/var/lib/postgresql/data -e POSTGRES_PASSWORD=demo catalogo-db:1.0` | Contenedor conectado a `red-demo` y con los datos de PostgreSQL en el volumen `datos-demo`. Es la base de la demostración de persistencia | Contenedor, red, volumen |

**Demostración de persistencia con el comando 26** (sirve para el criterio de Pruebas):

1. Esperar a que `docker logs db-demo3` muestre "ready to accept connections" después de "PostgreSQL init process complete" (el volumen está vacío, así que la imagen ejecuta `initdb`). Luego insertar un dato:
   `docker exec db-demo3 psql -U postgres -c "INSERT INTO aplicacion(nombre, origen, equipo_responsable) VALUES ('Demo', 'PROPIA', 'Equipo')"`
2. Eliminar el contenedor: `docker rm -f db-demo3`
3. Volver a ejecutar el mismo comando 26 (mismo volumen) y esperar otra vez "ready to accept connections" en `docker logs db-demo3`. Esta vez no aparece "PostgreSQL init process complete": el volumen ya tiene datos y no se ejecuta `initdb`.
4. Consultar: `docker exec db-demo3 psql -U postgres -c "SELECT nombre FROM aplicacion"`. El dato sigue ahí: **el volumen sobrevivió al contenedor**.

## Fase 6. La aplicación con Docker Compose

### Recorrido por `docker-compose.yml`

Los comandos de Compose se ejecutan desde la carpeta raíz del repositorio, donde está el archivo.

Antes de los comandos, se abre [`docker-compose.yml`](../docker-compose.yml) y se recorre de arriba abajo. El mensaje: **Compose reúne en un archivo lo que habría que escribir a mano con varios `docker build` y `docker run`**, como en las fases 2 a 5. El dibujo de lo mismo es el diagrama de contenedores de [arquitectura.md](arquitectura.md).

| Bloque del archivo | Qué significa | Equivale a |
|---|---|---|
| `name: catalogo-apps` | Nombre del proyecto. Es el prefijo de los contenedores (`catalogo-apps-db-1`, `catalogo-apps-app-1`) y del volumen (`catalogo-apps_db_data`) | — |
| Servicio `db` | La base de datos. Se construye desde `db/` como la imagen `catalogo-db:1.0`, la misma del comando 8 | `docker build` (8) y `docker run` (15, 26) |
| Servicio `seed` | Un trabajo a pedido que carga datos de ejemplo y termina. Está en el perfil `seed`, así que `docker compose up` **no** lo ejecuta. En el video no se usa (ver nota 6) | `docker run --rm` |
| Servicio `app` | La aplicación del catálogo. Se construye desde `app/` como la imagen `catalogo-app:1.0`. **La imagen de `app` es el servidor web**: Node.js atiende HTTP en el puerto 3000 y arma las páginas | `docker build` y `docker run` |
| `environment` con `${VARIABLE:-valor}` | Variables de entorno con un valor por defecto. Se cambian sin tocar el archivo, copiando `.env.example` a `.env`. En `app`, `DB_HOST: db` es el nombre del servicio de la base | `-e` (10, 15, 26) |
| `ports` | `app` publica `3000:3000`, para abrir `http://localhost:3000`. `db` publica `127.0.0.1:5432:5432`, **solo para desarrollo**: así quien programa la aplicación sin contenedor llega a la base, y solo desde la propia máquina | `-p` (15) |
| `healthcheck` en `db` | Cada 5 s pregunta con `pg_isready` si la base responde. Cuando responde, `db` queda *healthy* (sana) | — |
| `depends_on` con `service_healthy` | Orden de arranque: `app` (y `seed`) no arrancan hasta que `db` está sana | El orden en que se escriben los `docker run` |
| Volumen `db_data` | Donde PostgreSQL guarda los datos, fuera del contenedor. Sobrevive a `docker compose down` y solo se borra con `down -v` | `docker volume create` (24) y `-v` (26) |
| Red `catalogo-red` | Red privada del proyecto, con nombre explícito. Dentro de ella `app` encuentra a la base por el nombre `db` | `docker network create` (22) y `--network` (26) |
| `restart` e `init` | `restart: unless-stopped` vuelve a levantar el servicio si se cae. `init: true` hace que `app` reciba bien la señal de apagado | `--restart` e `--init` de `docker run` |

### Comandos

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 27 | `docker compose config` | Valida el archivo y lo muestra con las variables ya resueltas, incluidas las de `.env` si existe | Compose |
| 28 | `docker compose up -d --build` | Construye las imágenes de `db` y `app`, crea la red `catalogo-red` y el volumen, y levanta los servicios en el orden de `depends_on`: primero `db`, y `app` cuando `db` está sana | Compose, imagen, red, volumen, contenedor |
| 29 | `docker compose ps` | Estado de los servicios: `db` aparece *healthy* y con el puerto `127.0.0.1:5432->5432/tcp`; `app`, con `3000->3000/tcp`. `seed` no aparece: no forma parte del arranque. Con el puerto a la vista, se abre `http://localhost:3000` en el navegador | Compose, contenedor |
| 30 | `docker network inspect catalogo-red` | Muestra la red con nombre propio que define el Compose y los contenedores conectados a ella, `db` y `app` (`catalogo-apps-db-1` y `catalogo-apps-app-1`), cada uno con su IP interna. Dentro de esa red no hacen falta las IP: los contenedores se encuentran por el nombre del servicio, y por eso `app` llega a la base con `DB_HOST: db` | Red |
| 31 | `docker compose logs -f` | Los logs de todos los servicios, en vivo. En `db` se ve la creación de las tablas (`01-schema.sql`) y luego "ready to accept connections"; en `app`, el mensaje de que escucha en el puerto 3000. `Ctrl+C` deja de seguirlos, pero los contenedores siguen funcionando | Compose, contenedor |

### Demostración en el navegador

En `http://localhost:3000`:

1. La lista está **vacía**: la base arrancó sin datos.
2. Dos altas por el formulario. A una o a las dos se les agrega uno o más despliegues desde su detalle.
3. Carga masiva: subir [`docs/datos/aplicaciones-video.csv`](datos/aplicaciones-video.csv), con **15 aplicaciones y 23 despliegues** (una fila por despliegue). Se ve el resumen de la carga.
4. La lista muestra **al menos 15 aplicaciones** (17 con las del formulario).
5. El detalle de una aplicación con varios despliegues muestra la relación entre las dos tablas (una aplicación, de 0 a 3 despliegues).

El formato del archivo está en [`docs/datos/plantilla.csv`](datos/plantilla.csv).

### Comprobación y cierre

| # | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|
| 32 | `docker compose exec db psql -U catalogo -d catalogo -c "SELECT count(*) FROM aplicacion;"` | Consulta directa a la base de datos, sin pasar por la aplicación: los datos ingresados en el navegador están guardados en `db` | Compose, contenedor |
| 33 | `docker compose down` | Elimina los contenedores y la red, y **conserva el volumen** `db_data` | Compose, contenedor, red |
| 34 | `docker compose up -d` | Vuelve a levantar la aplicación completa: crea de nuevo la red y los contenedores, y `db` usa el mismo volumen. Se abre `http://localhost:3000` (o se repite la consulta del comando 32) y las aplicaciones cargadas siguen ahí: **los datos sobrevivieron a `down`** porque el volumen no se borró | Compose, contenedor, red, volumen |
| 35 | `docker compose down -v` | Elimina los contenedores, la red y también el volumen: ahora sí se borran los datos | Compose, volumen |

## Dos formas de hacer lo mismo

Mostrar las dos vías ayuda a "diferenciar usos". Con Compose, los contenedores se llaman `catalogo-apps-db-1` y `catalogo-apps-app-1`, la red `catalogo-red` y el volumen `catalogo-apps_db_data`.

| Tarea | Docker a mano | Docker Compose |
|---|---|---|
| Construir la imagen | `docker build -t catalogo-app:1.0 ./app` | `docker compose build app` |
| Crear la red y el volumen | `docker network create ...` y `docker volume create ...` | Los crea `docker compose up` |
| Crear y arrancar | `docker run -d --name app --network catalogo-red -p 3000:3000 -e DB_HOST=db ... catalogo-app:1.0` | `docker compose up -d app` (levanta antes `db`, porque `app` depende de ella) |
| Ver el estado | `docker ps` | `docker compose ps` |
| Ver logs | `docker logs -f app` | `docker compose logs -f app` |
| Entrar al contenedor | `docker exec -it db psql -U catalogo -d catalogo` | `docker compose exec db psql -U catalogo -d catalogo` |
| Detener | `docker stop app` | `docker compose stop app` |
| Eliminar | `docker rm app` | `docker compose down` |
| Eliminar con los datos | `docker rm -f db` y `docker volume rm catalogo-apps_db_data` | `docker compose down -v` |
| Ejecutar un trabajo de una sola vez | `docker run --rm ...` | `docker compose run --rm seed` |

## Notas para explicar bien

1. **`stop`, `kill` y `rm`.** `stop` envía `SIGTERM` y espera (10 s por defecto en Linux) antes de `SIGKILL`, así que el proceso puede cerrar con limpieza. `kill` envía `SIGKILL` de inmediato. `rm` elimina el contenedor, pero solo si está detenido, salvo que se use `-f`.
2. **Comillas en Windows.** En `cmd` y PowerShell conviene usar comillas dobles en los argumentos (`-c "\dt"`). Las comillas simples funcionan en Linux y macOS, pero no en `cmd`.
3. **Puertos ocupados.** En Compose, `db` publica `127.0.0.1:5432`, que puede chocar con un PostgreSQL instalado en la máquina. Si pasa, se cambia con `DB_PORT` en `.env` (por ejemplo, `DB_PORT=5434`). Lo mismo con el 3000 de `app` y `APP_PORT`. Los contenedores de práctica publican en el 5433, por si ya hay algo en el 5432.
4. **Antes de grabar**, limpiar lo que haya quedado de los ensayos para que cada comando funcione la primera vez y la base de Compose arranque vacía:

   ```bash
   docker rm -f db-demo db-demo2 db-demo3
   docker network rm red-demo
   docker volume rm datos-demo
   docker compose down -v
   docker rmi hello-world
   ```

   Los errores del tipo "No such container" significan que ya no existía y se pueden ignorar. Quitar `hello-world` hace que el comando 4 muestre la descarga desde el registry.
5. **Esperar a la base de datos.** Con el volumen vacío, la imagen de PostgreSQL ejecuta `initdb` y los scripts del esquema con un servidor temporal, y luego arranca el definitivo. Por eso "ready to accept connections" aparece dos veces en `docker logs`: la que vale es la que sigue a "PostgreSQL init process complete". Consultar o insertar antes puede fallar o dar un resultado incompleto. Compose no tiene este problema porque espera al `healthcheck`.
6. **Datos base a pedido.** `docker compose run --rm seed` carga unas aplicaciones de ejemplo. No forma parte del guion. Si se cargaron antes de grabar, sus aplicaciones aparecen en la lista y no cuentan para las 15 del video, así que conviene grabar partiendo de `docker compose down -v`.
