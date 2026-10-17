# Pendientes y preguntas abiertas

Cosas que **no estaban claras en el enunciado**, que el grupo tenía que decidir o que falta verificar. Las que ya se resolvieron quedan al final, con la decisión tomada.

## Por verificar técnicamente

| # | Qué verificar | Cómo comprobarlo |
|---|---|---|
| 20 | El entorno completo en Docker con la aplicación: que `app` construye y `/health` responde; que la red se llama `catalogo-red`; que `db` publica el puerto en `127.0.0.1:5432`; que `seed` funciona en la red nueva; y, cuando exista la aplicación, la carga de [`docs/datos/aplicaciones-video.csv`](datos/aplicaciones-video.csv) | `docker compose up -d --build`, `docker compose ps` (puertos y `db` *healthy*), `http://localhost:3000/health` (`{"estado":"ok"}`), `docker network ls`, `docker compose run --rm seed`, y la carga del CSV desde el navegador seguida de `SELECT count(*) FROM aplicacion;` |

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
| 13 | Construir y ejecutar la imagen `catalogo-db` con `docker-compose.yml` dentro de Docker | Verificado: la imagen construye, `01-schema.sql` corre en el primer arranque, `db` queda *healthy* y los datos sobreviven a `down` y `up`. La verificación con la aplicación es el #20 |
| 14 | ¿`psql -U postgres -c "\dt"` en el contenedor de práctica muestra las dos tablas? | Verificado: sí (el esquema queda en la base `postgres`). La demostración de persistencia con un volumen (comando 26 de [comandos.md](comandos.md)) también funciona tal como está escrita |
| 15 | La lectura de la Unidad 2 y la documentación de Docker describen de forma distinta cómo se suspende un contenedor | Ya no aplica: ese comando salió del guion |
| 16 | ¿Los diagramas en Mermaid se ven bien en el visor que se use? | Verificado: se ven bien |
| 17 | "15 tipos de datos diferentes" (criterio de Despliegue de la rúbrica, distinto de los "15 datos" de Pruebas) | El esquema se deja como está, con **15 columnas** ([ADR-0004](adr/0004-modelo-de-datos-del-catalogo.md)) |
| 18 | Seed a pedido y restricción de un despliegue por aplicación y ambiente | Verificado: `docker compose up` no ejecuta el seed; `docker compose run --rm seed` carga 4 aplicaciones y 6 despliegues sin dejar contenedor, y repetirlo no inserta nada. `uq_despliegue_aplicacion_ambiente` rechaza el segundo despliegue en un ambiente, y `ck_despliegue_nube_requiere_proveedor` rechaza `NUBE` sin proveedor y `SAAS` con proveedor |
| 19 | Supuestos que dos piezas separadas podrían resolver distinto (orden de las listas, campos desconocidos, mayúsculas en el nombre) | **Desaparece:** con una sola aplicación que arma las páginas en el servidor no hay un contrato entre dos piezas, y esos detalles se resuelven dentro de la aplicación ([ADR-0003](adr/0003-aplicacion-monolitica-en-capas.md)) |
