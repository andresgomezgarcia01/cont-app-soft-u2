# Guion de comandos Docker para el video

La rúbrica pide **al menos 30 comandos Docker en la consola, mostrando la instalación**, y para la nota máxima, **diferenciando su arquitectura y usos**. Esta lista tiene 53 comandos (holgura por si alguno falla al grabar). Los marcados con ★ son una selección de exactamente 30 que cuenta la historia completa.

Para que se vea la "arquitectura", al ejecutar cada comando se dice qué componente interviene:

```text
docker (CLI, el cliente) --API REST--> dockerd (daemon) --pull/push--> Registry (Docker Hub)
                                          |
                         administra: imágenes, contenedores, redes, volúmenes
```

Los nombres `db-demo`, `db-demo2`, `db-demo3`, `catalogo-net` y `db-datos` son de práctica y no chocan con los de Compose.

## Fase 1. Instalación y verificación

Mostrar primero la instalación de Docker Desktop y luego abrir la consola.

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 1 | ★ | `docker --version` | Versión del cliente instalado | Cliente |
| 2 | ★ | `docker compose version` | Compose v2 viene como plugin del mismo CLI | Cliente |
| 3 | ★ | `docker info` | Estado del daemon: contenedores, imágenes, runtime y sistema operativo | Daemon |
| 4 | ★ | `docker run --rm hello-world` | Primer contenedor. El cliente pide al daemon, que descarga la imagen del registry, la crea y la ejecuta. `--rm` lo elimina al terminar | Cliente, daemon, registry |
| 5 | | `docker search --limit 3 postgres` | Busca imágenes en Docker Hub, el registry público por defecto | Registry |

## Fase 2. Imágenes

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 6 | ★ | `docker pull postgres:17-alpine` | Descarga una imagen. Cada línea de progreso es una **capa** | Registry, imagen |
| 7 | ★ | `docker images` | Lista las imágenes locales (equivale a `docker image ls`) | Imagen |
| 8 | | `docker image inspect postgres:17-alpine` | Metadatos: capas, variables de entorno, puertos expuestos, comando por defecto | Imagen |
| 9 | ★ | `docker history postgres:17-alpine` | Las capas de la imagen y la instrucción que creó cada una | Imagen (capas) |
| 10 | ★ | `docker build -t catalogo-db:1.0 ./db` | Construye la imagen propia a partir de `db/Dockerfile`. Es la "imagen de base de datos" que pide la actividad | Cliente, daemon, imagen |
| 11 | ★ | `docker tag catalogo-db:1.0 catalogo-db:latest` | Agrega una segunda etiqueta a la misma imagen (no la copia) | Imagen |
| 12 | | `docker images catalogo-db` | Filtra por repositorio: se ven las dos etiquetas con el mismo `IMAGE ID` | Imagen |

## Fase 3. Ciclo de vida de un contenedor

Es el ciclo de la Figura 3 de la lectura de la Unidad 2: creado, en ejecución, pausado, detenido y eliminado.

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 13 | ★ | `docker create --name db-demo -e POSTGRES_PASSWORD=demo catalogo-db:1.0` | Crea el contenedor **sin arrancarlo** (estado *Created*) | Contenedor |
| 14 | ★ | `docker ps -a` | Lista todos los contenedores, también los creados o detenidos | Contenedor |
| 15 | ★ | `docker start db-demo` | Inicia el contenedor ya creado | Contenedor |
| 16 | | `docker ps` | Solo los que están en ejecución | Contenedor |
| 17 | ★ | `docker pause db-demo` | Congela sus procesos. La memoria sigue ocupada (ver nota 1) | Contenedor |
| 18 | ★ | `docker unpause db-demo` | Reanuda los procesos | Contenedor |
| 19 | ★ | `docker stop db-demo` | Detención ordenada: envía `SIGTERM` y, si no termina en 10 s (valor por defecto), `SIGKILL`. Libera la memoria | Contenedor |
| 20 | ★ | `docker rm db-demo` | Elimina el contenedor. Debe estar detenido; si está en ejecución, da error (o se usa `-f`) | Contenedor |
| 21 | ★ | `docker run -d --name db-demo2 -e POSTGRES_PASSWORD=demo -p 5433:5432 catalogo-db:1.0` | `run` = `create` + `start` en un paso. `-d` lo deja en segundo plano y `-p 5433:5432` publica el puerto (máquina 5433, contenedor 5432) | Contenedor |

## Fase 4. Inspección y operación

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 22 | ★ | `docker logs --tail 20 db-demo2` | Salida estándar del contenedor. Con `-f` la sigue en vivo | Contenedor |
| 23 | ★ | `docker exec -it db-demo2 psql -U postgres -c "\dt"` | Ejecuta un comando dentro del contenedor en ejecución. Muestra las dos tablas: **el esquema viene dentro de la imagen** | Contenedor |
| 24 | ★ | `docker inspect db-demo2` | Configuración y estado completos: IP, montajes, variables, puertos | Contenedor |
| 25 | | `docker stats --no-stream` | Consumo de CPU y memoria por contenedor | Contenedor |
| 26 | | `docker top db-demo2` | Procesos del contenedor vistos desde la máquina | Contenedor |
| 27 | | `docker port db-demo2` | Mapeo de puertos publicados | Contenedor, red |
| 28 | | `docker diff db-demo2` | Cambios en el sistema de archivos respecto de la imagen | Contenedor |
| 29 | ★ | `docker kill db-demo2` | `SIGKILL` inmediato, sin limpieza. Contrastar con `stop` (ver nota 2) | Contenedor |
| 30 | | `docker rm db-demo2` | Elimina el contenedor que se acaba de matar | Contenedor |

## Fase 5. Redes y volúmenes

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 31 | ★ | `docker network create catalogo-net` | Crea una red. En ella los contenedores se encuentran por nombre | Red |
| 32 | | `docker network ls` | Lista las redes | Red |
| 33 | | `docker network inspect catalogo-net` | Detalle de la red y de los contenedores conectados | Red |
| 34 | ★ | `docker volume create db-datos` | Crea un volumen nombrado, gestionado por Docker | Volumen |
| 35 | | `docker volume ls` | Lista los volúmenes | Volumen |
| 36 | | `docker volume inspect db-datos` | Dónde y cómo se guarda el volumen | Volumen |
| 37 | | `docker run -d --name db-demo3 --network catalogo-net -v db-datos:/var/lib/postgresql/data -e POSTGRES_PASSWORD=demo catalogo-db:1.0` | Contenedor con red y volumen propios | Contenedor, red, volumen |

**Demostración de persistencia con el contenedor 37** (sirve para el criterio de Pruebas):

1. Insertar un dato: `docker exec db-demo3 psql -U postgres -c "INSERT INTO aplicacion(nombre, origen, equipo_responsable) VALUES ('Demo', 'PROPIA', 'Equipo')"`
2. Eliminar el contenedor: `docker rm -f db-demo3`
3. Volver a ejecutar el mismo comando 37 (mismo volumen).
4. Consultar: `docker exec db-demo3 psql -U postgres -c "SELECT nombre FROM aplicacion"`. El dato sigue ahí: **el volumen sobrevivió al contenedor**.

## Fase 6. Docker Compose (la aplicación completa)

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 38 | ★ | `docker compose config` | Valida el archivo y lo muestra con las variables ya resueltas | Compose |
| 39 | | `docker compose build` | Construye las imágenes de los servicios con `build`. Equivale a `docker build` por servicio | Compose, imagen |
| 40 | ★ | `docker compose up -d --build` | Crea la red y el volumen, construye las imágenes y levanta los servicios en el orden de `depends_on` | Compose |
| 41 | ★ | `docker compose ps` | Estado y salud: `db` aparece *healthy* y `seed` *exited (0)* porque es un job de ejecución única | Compose |
| 42 | ★ | `docker compose logs seed` | Muestra la carga de los datos base | Compose |
| 43 | ★ | `docker compose exec db psql -U catalogo -d catalogo -c "SELECT count(*) FROM aplicacion;"` | Consulta directa a la base de datos, independiente de la aplicación | Compose, contenedor |
| 44 | | `docker compose stop` | Detiene los servicios sin eliminarlos | Compose |
| 45 | | `docker compose start` | Vuelve a iniciar los servicios detenidos | Compose |
| 46 | ★ | `docker compose down` | Elimina contenedores y red, **conserva el volumen**. Al volver a subir, los datos siguen | Compose |
| 47 | ★ | `docker compose down -v` | Elimina también el volumen: los datos se borran | Compose, volumen |

## Fase 7. Limpieza

| # | | Comando | Qué hace y qué decir | Componente |
|---|---|---|---|---|
| 48 | | `docker rmi catalogo-db:latest` | Elimina una etiqueta o imagen local | Imagen |
| 49 | | `docker container prune` | Elimina todos los contenedores detenidos | Contenedor |
| 50 | | `docker image prune` | Elimina imágenes huérfanas (*dangling*) | Imagen |
| 51 | | `docker volume rm db-datos` | Elimina el volumen de práctica | Volumen |
| 52 | | `docker network rm catalogo-net` | Elimina la red de práctica | Red |
| 53 | | `docker system df` | Espacio en disco usado por imágenes, contenedores y volúmenes | Daemon |

## Dos formas de hacer lo mismo

Mostrar las dos vías ayuda a "diferenciar usos". Con Compose, los contenedores se llaman `catalogo-apps-db-1`, etc., y el volumen `catalogo-apps_db_data`.

| Tarea | Docker a mano | Docker Compose |
|---|---|---|
| Construir la imagen | `docker build -t catalogo-db:1.0 ./db` | `docker compose build db` |
| Crear y arrancar | `docker run -d --name db ...` | `docker compose up -d db` |
| Ver el estado | `docker ps` | `docker compose ps` |
| Ver logs | `docker logs db` | `docker compose logs db` |
| Entrar al contenedor | `docker exec -it db psql ...` | `docker compose exec db psql ...` |
| Detener | `docker stop db` | `docker compose stop db` |
| Eliminar | `docker rm db` | `docker compose down` |
| Eliminar con los datos | `docker rm -f db` y `docker volume rm catalogo-apps_db_data` | `docker compose down -v` |

## Notas para explicar bien

1. **`pause` y `SIGSTOP`.** La lectura de la Unidad 2 dice que "usualmente" se usa `SIGSTOP` para suspender. La documentación de Docker aclara que en Linux `docker pause` usa el **cgroup *freezer***, y que `SIGSTOP` es la forma tradicional, que el proceso puede observar, mientras que con el *freezer* el proceso no se entera de que lo suspendieron. Conviene decirlo así en el video: congela los procesos, la memoria sigue ocupada y el proceso no lo detecta. Está anotado en [pendientes.md](pendientes.md).
2. **`stop`, `kill` y `rm`.** `stop` envía `SIGTERM` y espera (10 s por defecto en Linux) antes de `SIGKILL`, así que el proceso puede cerrar con limpieza. `kill` envía `SIGKILL` de inmediato. `rm` elimina el contenedor, pero solo si está detenido, salvo que se use `-f`.
3. **Comillas en Windows.** En `cmd` y PowerShell conviene usar comillas dobles en los argumentos (`-c "\dt"`). Las comillas simples funcionan en Linux y macOS, pero no en `cmd`.
4. **Puertos ocupados.** Si el puerto 5432 está en uso, cambiar `DB_PORT` en `.env`. Los contenedores de práctica usan 5433 para no chocar con Compose.
5. **Antes de grabar:** comprobar que no existan contenedores, redes ni volúmenes con los nombres de práctica, para que cada comando funcione la primera vez.
6. **Los comandos 40 a 47 requieren** `backend/Dockerfile` y `frontend/Dockerfile`. Hasta que existan, se puede practicar con `docker compose up -d db seed`.
