# Pendientes y preguntas abiertas

Cosas que **no están claras en el enunciado** o que el grupo debe decidir. Cada una indica el supuesto con el que se avanzó mientras tanto. Las que ya se resolvieron quedan al final, con la decisión tomada.

## Para decidir en el grupo

| # | Decisión | Por qué importa | Supuesto actual o dónde queda registrada |
|---|---|---|---|
| 4 | Qué "estándares UX/UI" se cumplen para el nivel excelente | La rúbrica los pide sin definirlos | La lista de [frontend/README.md](../frontend/README.md) |
| 7 | Duración final del video | El enunciado no la fija | Objetivo de 10 a 15 minutos, con el reparto de [rubrica-y-evidencias.md](rubrica-y-evidencias.md#3-orden-sugerido-del-video) |
| 8 | Lenguaje y framework del **backend** | Define cómo se construye la API y su Dockerfile | [ADR-0009](adr/0009-stack-del-backend.md) |
| 9 | Framework del **frontend** | Define cómo se construye la interfaz y su Dockerfile | [ADR-0010](adr/0010-stack-del-frontend.md) |
| 10 | Responsables de cada parte (base de datos y Compose, backend, frontend, documentación, video) | Reparto del trabajo | Tabla de estado del [README](../README.md) |
| 11 | Si se agrega editar y eliminar (CRUD completo) | El mínimo que pide el enunciado es crear y consultar | **Base decidida: crear y consultar** ([contrato](api/openapi.yaml)). Si el grupo decide el CRUD completo, se agrega como incremento: `PUT` como reemplazo completo (`activa` y `desplegado_en` obligatorios, los opcionales que no vengan quedan en `null`, `fecha_registro` no cambia); `DELETE` (la aplicación se elimina en cascada con sus despliegues); `409` por ambiente al editar un despliegue hacia un ambiente ocupado; y pasar a otra versión editando el despliegue de ese ambiente |
| 17 | "15 tipos de datos diferentes" (criterio de Despliegue de la rúbrica, distinto de los "15 datos" de Pruebas) | Hoy hay 15 columnas con 6 tipos SQL distintos (`INTEGER`, `VARCHAR`, `TEXT`, `BOOLEAN`, `DATE`, `TIMESTAMPTZ`). Sin contar las llaves (`id`, `id`, `aplicacion_id`) son **12 variables** | Dos caminos: **defender la lectura "15 variables"** (el nivel Excelente habla de "el total de las variables especificadas", y en el video se muestra `\d`), que solo se sostiene si se cuentan las llaves; o la **opción barata**: agregar 3 o 4 columnas **opcionales y sin reglas**, por ejemplo `aplicacion.costo_mensual NUMERIC(12,2)`, `aplicacion.criticidad SMALLINT`, `despliegue.replicas SMALLINT` y `despliegue.ventana_mantenimiento TIME` (con las cuatro quedan 16 variables y 9 tipos). Si cambia el esquema, se actualizan `db/schema.sql`, el contrato y [ADR-0004](adr/0004-modelo-de-datos-del-catalogo.md) |
| 19 | Huecos del contrato que backend y frontend podrían resolver distinto | Si cada uno asume algo diferente, no encajan en la integración | Supuestos propuestos, por confirmar: **orden** de la lista por `id` ascendente (en el video se ve en el orden en que se cargó) y los despliegues del detalle en orden `DEV`, `QA`, `PROD`; **campos desconocidos** en el JSON de entrada (por ejemplo `id` o `fecha_registro`) se ignoran, no dan `400`; **método no permitido** (por ejemplo `DELETE`, que hoy no existe) responde `404` `NO_ENCONTRADO` con el formato de error, para no agregar un código nuevo; el **nombre** es único distinguiendo mayúsculas (como hoy en la base de datos). Lo que se acuerde va a `openapi.yaml` y `errores.md` |

## Resueltos

| # | Pregunta | Decisión |
|---|---|---|
| 1 | ¿"7 columnas por tabla" es exacto o un mínimo? | Es un **mínimo**: `aplicacion` tiene 7 y `despliegue` tiene 8 ([ADR-0004](adr/0004-modelo-de-datos-del-catalogo.md)) |
| 2 | ¿Qué son los "15 datos"? | **Al menos 15 aplicaciones** ingresadas en el video, cada una con sus despliegues. No son 15 filas sumando ambas tablas, y las de los datos base no cuentan |
| 3 | ¿La carga masiva por JSON cuenta como "ingresar datos"? | **Sí cuenta.** En el video: unas 2 altas por el formulario y un JSON de 15 aplicaciones ([ADR-0006](adr/0006-carga-masiva-json.md)) |
| 5 | ¿Los comandos de `docker compose` cuentan dentro de los 30? | **Sí cuentan** ([comandos.md](comandos.md)) |
| 6 | ¿La entrega es individual o grupal? | **Grupal, 3 integrantes** |
| 12 | Cronograma de reuniones de integración y grabación | Se quitó: no hace falta documentarlo |
| 15 | La lectura de la Unidad 2 dice que `docker pause` usa `SIGSTOP`, pero la documentación de Docker dice que en Linux usa el cgroup *freezer* | En el video se explica según la documentación de Docker ([comandos.md](comandos.md#notas-para-explicar-bien), nota 1) |
| 16 | ¿Los diagramas en Mermaid se ven bien en el visor que se use? | Verificado: se ven bien |
| 13 | Construir y ejecutar la imagen `catalogo-db` y el `docker-compose.yml` dentro de Docker | Verificado: la imagen construye, `01-schema.sql` corre en el primer arranque, `db` queda *healthy* y los datos sobreviven a `down` y `up`. El Compose completo se probó con una API de prueba: `web` reenvía `/api/` a `api`, vuelve a resolver el nombre si se recrea `api`, y responde `502` con la API caída |
| 14 | ¿`psql -U postgres -c "\dt"` en el contenedor de práctica muestra las dos tablas? | Verificado: sí (el esquema queda en la base `postgres`). La demostración de persistencia del comando 37 también funciona tal como está escrita |
| 18 | Seed a pedido y restricción de un despliegue por aplicación y ambiente | Verificado: `docker compose up` no ejecuta el seed; `docker compose run --rm seed` carga 4 aplicaciones y 6 despliegues sin dejar contenedor, y repetirlo no inserta nada. `uq_despliegue_aplicacion_ambiente` rechaza el segundo despliegue en un ambiente, y `ck_despliegue_nube_requiere_proveedor` rechaza `NUBE` sin proveedor y `SAAS` con proveedor |
