# Pendientes y preguntas abiertas

Cosas que **no estaban claras en el enunciado**, que el grupo tenía que decidir o que falta verificar. Las que ya se resolvieron quedan al final, con la decisión tomada.

## Por verificar técnicamente

No hay pendientes técnicos.

## Resueltos

| # | Pregunta | Decisión |
|---|---|---|
| 1 | ¿"7 columnas por tabla" es exacto o un mínimo? | Es un **mínimo**: `aplicacion` tiene 7 y `despliegue` tiene 8 ([ADR-0004](adr/0004-modelo-de-datos-del-catalogo.md)) |
| 2 | ¿Qué son los "15 datos"? | **Al menos 15 aplicaciones** ingresadas en el video, cada una con sus despliegues. No son 15 filas sumando ambas tablas, y las de los datos base no cuentan |
| 3 | ¿La carga masiva cuenta como "ingresar datos"? | **Sí cuenta.** En el video: unas 2 altas por el formulario y un CSV de 15 aplicaciones ([ADR-0006](adr/0006-carga-masiva-csv.md)) |
| 4 | ¿Qué "estándares UX/UI" se cumplen para el nivel excelente? | Quedan a criterio de quien desarrolla la aplicación |
| 5 | ¿Los comandos de `docker compose` cuentan dentro de los 30? | **Sí cuentan** ([comandos.md](comandos.md)) |
| 6 | ¿La entrega es individual o grupal? | **Grupal, 3 integrantes** |
| 7 | Duración final del video | **Unos 15 minutos**, con el reparto de [rubrica-y-evidencias.md](rubrica-y-evidencias.md#3-orden-sugerido-del-video) |
| 8 y 9 | Lenguaje y framework de la aplicación | **Node.js**, en una aplicación monolítica ([ADR-0003](adr/0003-aplicacion-monolitica-en-capas.md)) |
| 10 | Responsables de cada parte del trabajo | Organización interna del grupo |
| 11 | ¿Se agrega editar y eliminar (CRUD completo)? | **No:** solo crear y consultar |
| 12 | Cronograma de reuniones de integración y grabación | Se quitó: no hace falta documentarlo |
| 13 | Construir y ejecutar la imagen `catalogo-db` con `docker-compose.yml` dentro de Docker | Verificado: la imagen construye, `01-schema.sql` corre en el primer arranque, `db` queda *healthy* y los datos sobreviven a `down` y `up`. La verificación con la aplicación es el #21, y la de la carga del CSV, el #20 |
| 14 | ¿`psql -U postgres -c "\dt"` en el contenedor de práctica muestra las dos tablas? | Verificado: sí (el esquema queda en la base `postgres`). La demostración de persistencia con un volumen (comando 26 de [comandos.md](comandos.md)) también funciona tal como está escrita |
| 15 | La lectura de la Unidad 2 y la documentación de Docker describen de forma distinta cómo se suspende un contenedor | Ya no aplica: ese comando salió del guion |
| 16 | ¿Los diagramas en Mermaid se ven bien en el visor que se use? | Verificado: se ven bien |
| 17 | "15 tipos de datos diferentes" (criterio de Despliegue de la rúbrica, distinto de los "15 datos" de Pruebas) | El esquema se deja como está, con **15 columnas** ([ADR-0004](adr/0004-modelo-de-datos-del-catalogo.md)) |
| 18 | Seed a pedido y restricción de un despliegue por aplicación y ambiente | Verificado: `docker compose up` no ejecuta el seed; `docker compose run --rm seed` carga 4 aplicaciones y 6 despliegues sin dejar contenedor, y repetirlo no inserta nada. `uq_despliegue_aplicacion_ambiente` rechaza el segundo despliegue en un ambiente, y `ck_despliegue_nube_requiere_proveedor` rechaza `NUBE` sin proveedor y `SAAS` con proveedor |
| 19 | Supuestos que dos piezas separadas podrían resolver distinto (orden de las listas, campos desconocidos, mayúsculas en el nombre) | **Desaparece:** con una sola aplicación que arma las páginas en el servidor no hay un contrato entre dos piezas, y esos detalles se resuelven dentro de la aplicación ([ADR-0003](adr/0003-aplicacion-monolitica-en-capas.md)) |
| 20 | La carga de [`docs/datos/aplicaciones-video.csv`](datos/aplicaciones-video.csv) desde `/carga` y la demostración en el navegador | Verificado en Docker: el archivo crea 15 aplicaciones y 23 despliegues, y cargarlo otra vez da `409` sin guardar nada. Se aceptan el separador `;` y el BOM; más de 100 filas da `413`; un encabezado incorrecto da `400`; un error en una fila da el error con la fila y la columna y no guarda nada (todo o nada). La lista con búsqueda, el detalle con sus despliegues, el alta de aplicación (`409` por nombre repetido) y el alta de despliegue (rechaza el ambiente repetido y aplica R1 y R2) también funcionan. La demostración en el navegador se hace en el video, siguiendo los pasos de la [demostración en el navegador](comandos.md#demostración-en-el-navegador) |
| 21 | El entorno completo en Docker con el servicio `app` y la red `catalogo-red` | Verificado: las imágenes `catalogo-db:1.0` y `catalogo-app:1.0` construyen y `docker compose up -d --wait` deja `db` y `app` *healthy*. `/health` responde `200` y, con la base detenida, `503` en unos 5 s; `app` se detiene en 1 s con `SIGTERM`. La base queda publicada solo en `127.0.0.1:5432` y la aplicación en el 3000, y la red `catalogo-red` conecta `db` y `app`. Las tablas arrancan vacías; `docker compose run --rm seed` carga 4 aplicaciones y 6 despliegues, es idempotente y no deja contenedor; las restricciones rechazan un ambiente repetido y `NUBE` sin proveedor. Los datos persisten con `down` y `up` y se borran con `down -v`. Los 36 comandos de [comandos.md](comandos.md) funcionan tal como están escritos. La carga del CSV con la aplicación es el #20 |
