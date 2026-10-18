# ADR-0007: Arranque ordenado con healthcheck y seed a pedido

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

PostgreSQL tarda unos segundos en aceptar conexiones. Si la aplicación arranca antes, falla al conectarse. Además, en desarrollo local conviene tener datos base sin cargarlos a mano y sin duplicarlos cada vez. En el video, en cambio, la base debe arrancar vacía: las aplicaciones que se muestran son las que se ingresan durante la grabación.

## Decisión

- `db` declara un **`healthcheck`** con `pg_isready -h 127.0.0.1`, es decir, por TCP. Es deliberado: en el primer arranque, la imagen oficial ejecuta los scripts de `initdb.d` con un servidor temporal que **solo escucha por socket Unix** (`listen_addresses=''`). Un `pg_isready` sin `-h` usaría el socket y daría "sano" antes de tiempo; al consultar por TCP, solo responde cuando arrancó el servidor definitivo.
- `seed` y `app` usan `depends_on` con `condition: service_healthy`: no arrancan hasta que la base de datos responde.
- `app` declara su propio `healthcheck`, que consulta `/health` con `wget`. Nadie depende de él: muestra en `docker compose ps` si la aplicación responde y llega a la base, y hace que `docker compose up --wait` espere a que atienda (sin él, `--wait` la daba por lista unos 400 ms antes de que Node escuchara).
- **`seed` es un job a pedido**: pertenece al perfil `seed` (`profiles: ["seed"]`), así que `docker compose up` **no** lo ejecuta. Se carga con `docker compose run --rm seed`, que levanta `db` si hace falta, espera a que esté sana, ejecuta `db/seed/seed.sql` y borra el contenedor.
- Nombrar el servicio `seed` en un comando de Compose activa su perfil. Por eso ningún comando del arranque normal lo nombra.
- El script de seed es **idempotente** (`ON CONFLICT DO NOTHING` sobre `uq_aplicacion_nombre` y `uq_despliegue_aplicacion_ambiente`): ejecutarlo varias veces no duplica datos.
- `app` **no depende** del seed. Los datos base son útiles en desarrollo, no críticos.
- Si la base de datos se cae con la aplicación ya en ejecución, las páginas muestran un mensaje de error (`500`) y `/health` responde `503`, con lo que `app` aparece *unhealthy* en `docker compose ps` ([errores.md](../errores.md)).

## Alternativas consideradas

- **Reintentos de conexión dentro de la aplicación.** Funciona, pero agrega código que el orden de arranque de Compose evita. Puede combinarse más adelante.
- **Pausas fijas (`sleep`).** Frágiles: dependen de la velocidad de cada máquina.
- **Cargar el seed desde `/docker-entrypoint-initdb.d/`.** Solo corre con el volumen vacío y no se puede repetir bajo demanda.
- **Un job aparte que cree el esquema.** PostgreSQL ya ejecuta los scripts de `initdb.d` en el primer arranque, así que el job sería una pieza adicional sin beneficio. Se descarta por ahora y puede reconsiderarse si el esquema debe aplicarse sobre una base ya inicializada.
- **Seed en cada `docker compose up`** (job de ejecución única sin perfil). Era la versión anterior de esta decisión. Mezcla datos base con los que se ingresan en el video y no deja arrancar con la base vacía sin pasos extra.
- **`docker compose --profile seed up`.** Carga los datos, pero deja un contenedor `seed` detenido que aparece en `docker ps -a` y hay que borrar a mano.
- **`docker compose exec -T db psql ... < db/seed/seed.sql`.** No necesita servicio, pero la redirección `<` no funciona en PowerShell, así que el comando no sería el mismo en todas las máquinas.

## Consecuencias

- El arranque es determinista sin código adicional en la aplicación.
- En el video la base arranca vacía: todas las aplicaciones que se ven se ingresan durante la grabación.
- En desarrollo local, cargar los datos base es un paso explícito: `docker compose run --rm seed`.
- Mostrar `depends_on` y `healthcheck` en el video evidencia varios conceptos de contenerización.
- El `healthcheck` usa 5 s de intervalo, 10 reintentos y 10 s de gracia inicial (`start_period`), pensados para que el primer arranque no falle en máquinas lentas. Son valores ajustables.
