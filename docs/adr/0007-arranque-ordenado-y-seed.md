# ADR-0007: Arranque ordenado con healthcheck y seed como job único

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

PostgreSQL tarda unos segundos en aceptar conexiones. Si la API arranca antes, falla. Además, se quieren cargar datos base sin hacerlo a mano y sin duplicarlos cada vez que se levanta el entorno.

## Decisión

- `db` declara un **`healthcheck`** con `pg_isready -h 127.0.0.1`, es decir, por TCP. Es deliberado: en el primer arranque, la imagen oficial ejecuta los scripts de `initdb.d` con un servidor temporal que **solo escucha por socket Unix** (`listen_addresses=''`). Un `pg_isready` sin `-h` usaría el socket y daría "sano" antes de tiempo; al consultar por TCP, solo responde cuando arrancó el servidor definitivo.
- `seed` y `api` usan `depends_on` con `condition: service_healthy`: no arrancan hasta que la base de datos responde.
- **`seed` es un contenedor de ejecución única** (`restart: "no"`): ejecuta `db/seed/seed.sql` y termina.
- El script de seed es **idempotente** (`ON CONFLICT DO NOTHING` y `WHERE NOT EXISTS`): ejecutarlo varias veces no duplica datos.
- La API **no espera** al seed. Los datos base son útiles, no críticos.
- Si la base de datos se cae con la API ya en ejecución, la API responde `503` ([errores.md](../errores.md)).

## Alternativas consideradas

- **Reintentos de conexión dentro de la API.** Funciona, pero agrega código que el orden de arranque de Compose evita. Puede combinarse más adelante.
- **Pausas fijas (`sleep`).** Frágiles: dependen de la velocidad de cada máquina.
- **Cargar el seed desde `/docker-entrypoint-initdb.d/`.** Solo corre con el volumen vacío y no se puede repetir bajo demanda.
- **Un job aparte que cree el esquema.** PostgreSQL ya ejecuta los scripts de `initdb.d` en el primer arranque, así que el job sería una pieza adicional sin beneficio. Se descarta por ahora y puede reconsiderarse si el esquema debe aplicarse sobre una base ya inicializada.

## Consecuencias

- El arranque es determinista sin código adicional en la API.
- Mostrar `depends_on`, `healthcheck` y el job de seed en el video evidencia varios conceptos de contenerización.
- El `healthcheck` usa 5 s de intervalo, 10 reintentos y 10 s de gracia inicial (`start_period`), pensados para que el primer arranque no falle en máquinas lentas. Son valores ajustables.
