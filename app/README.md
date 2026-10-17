# Aplicación del catálogo

Este documento es la **especificación del desarrollo** de la aplicación: qué construir, cómo está organizada, qué reglas cumple y cómo probarla. Basta con leerlo para empezar. Lo que no esté definido aquí ni en los documentos enlazados se consulta con el grupo antes de decidirlo.

Documentos que complementan este: [errores](../docs/errores.md) (códigos y cómo se muestran), [modelo de datos](../db/schema.sql) (tablas y restricciones), [arquitectura](../docs/arquitectura.md) (contenedores y capas) y los ADR [0003](../docs/adr/0003-aplicacion-monolitica-en-capas.md) (monolito en capas) y [0006](../docs/adr/0006-carga-masiva-csv.md) (carga del CSV).

## 1. Qué es

- Un **monolito en Node.js con Express**: un solo proceso sirve la interfaz, aplica las reglas y habla con PostgreSQL.
- **Renderizado en el servidor** con plantillas: cada ruta devuelve una página HTML completa. El motor de plantillas lo elige quien desarrolla (por ejemplo, EJS). Los formularios y la subida del CSV se envían al servidor, que responde con la página siguiente.
- **Sin API de datos.** `GET /health` es la única ruta técnica y la única que responde en JSON.
- **Alcance: crear y consultar.** Lista con búsqueda, detalle con sus despliegues, alta de aplicación, alta de despliegue y carga de un archivo CSV. No se edita ni se elimina.
- Corre en el contenedor `app` del `docker-compose.yml`, en el puerto 3000. Su imagen es el servidor web de la aplicación.

## 2. Estado

El esqueleto es **mínimo**: solo lo necesario para que el contenedor se construya, arranque y se pueda verificar. Corre en local y en Docker. **Lo que hay:**

| Archivo | Qué hace |
|---|---|
| `package.json` | Dependencias: `express` y `pg`. Script `npm start` |
| `src/index.js` | Todo el esqueleto en un solo archivo: lee las variables de entorno (sección 8) con sus valores por defecto, crea el *pool* de conexiones a PostgreSQL, expone `GET /health` (`200` o `503`, en JSON), escucha en `0.0.0.0` en el puerto `PORT` y cierra ordenadamente con `SIGTERM` y `SIGINT` (cierra el servidor y el *pool*) |
| `Dockerfile`, `.dockerignore` | La imagen `catalogo-app:1.0` (sección 11) |

Fuera de `/health` no hay nada: `GET /` y cualquier otra ruta responden el `404` por defecto de Express (`Cannot GET /`). No hay vistas, ni estilos, ni manejo de errores propio, y **las carpetas de las capas todavía no existen**.

**Lo que falta (lo hace quien desarrolla):**

- crear la estructura de capas de la sección 7: `src/routes`, `src/services`, `src/repositories`, `src/views` y `src/public`;
- elegir el motor de plantillas (por ejemplo, EJS), instalarlo con `npm install <paquete>` y configurarlo en Express (`app.set('views', ...)` y `app.set('view engine', ...)`);
- servir los estáticos de `src/public` con `express.static` y escribir los estilos;
- leer los formularios: `app.use(express.urlencoded({ extended: false }))`, y una librería para la subida del archivo (sección 5);
- todas las páginas y rutas de la sección 3, con sus vistas, servicios y repositorios, incluido que `GET /` redirija a `/aplicaciones`;
- la carga del CSV (sección 5);
- el manejo de errores: un manejador para las rutas inexistentes (`404`) y un **manejador global de errores** que muestre una **página de error propia**, con `500` o con `503` si la base no responde ([errores.md](../docs/errores.md#9-reglas-para-quien-implementa));
- si se quiere, separar la configuración y el *pool* de `src/index.js` en módulos propios (sección 7);
- el `package-lock.json` (se genera con `npm install` y se commitea).

## 3. Páginas y rutas

Todas las páginas tienen un menú con tres enlaces: **Aplicaciones** (`/aplicaciones`), **Nueva aplicación** (`/aplicaciones/nueva`) y **Cargar CSV** (`/carga`). Las páginas de ingreso de datos y la de lista deben ser **enlaces distintos**: lo pide la actividad.

| Método | Ruta | Qué hace | Si sale bien | Si sale mal |
|---|---|---|---|---|
| `GET` | `/` | Entrada a la aplicación | Redirige a `/aplicaciones` | — |
| `GET` | `/aplicaciones` | Lista de aplicaciones, con búsqueda por nombre (`?q=`) | `200`, la lista | `400` si `q` es inválido: la lista con el mensaje junto al buscador |
| `GET` | `/aplicaciones/nueva` | Formulario de alta de aplicación | `200`, el formulario vacío | — |
| `POST` | `/aplicaciones` | Crea una aplicación | Redirige a `/aplicaciones/:id` (la creada) con una confirmación visible | `400` o `409`: vuelve a mostrar el formulario con el error y los datos escritos |
| `GET` | `/aplicaciones/:id` | Detalle de la aplicación con la tabla de **sus despliegues** y el formulario de alta de despliegue | `200`, el detalle | `400` (id no numérico) o `404` (no existe): página de error |
| `POST` | `/aplicaciones/:id/despliegues` | Crea un despliegue de esa aplicación | Redirige a `/aplicaciones/:id` con una confirmación visible | `400`, `409` o `422`: vuelve a mostrar el detalle con el error y los datos escritos en el formulario de despliegue. `404`: página de error |
| `GET` | `/carga` | Formulario para subir el archivo CSV | `200`, el formulario | — |
| `POST` | `/carga` | Procesa el CSV (sección 5) | `200`, la página de resumen | `400`, `409`, `413` o `422`: la página de carga con el error (fila y columna) |
| `GET` | `/health` | Estado de la aplicación y de su conexión con la base | `200` con `{"estado":"ok"}` (ya existe) | `503` en JSON (ya existe) |

En cualquier página, una ruta inexistente da `404` y un error inesperado `500` (o `503` si la base no responde), con la página de error propia. Detalle de cada código en [errores.md](../docs/errores.md#4-qué-errores-puede-dar-cada-página-o-acción).

**Contenido de cada página:**

- **Lista:** una tabla con nombre (enlace al detalle), origen, equipo responsable, activa (Sí o No), fecha de registro y **cantidad de despliegues**. Un buscador que envía `GET /aplicaciones?q=...`: muestra las aplicaciones cuyo nombre **contiene** el texto, sin distinguir mayúsculas (`ILIKE`). `q` vacío o ausente muestra todas; más de 100 caracteres da `400`. Sin resultados, un mensaje ("Ninguna aplicación coincide con la búsqueda") con `200`. Orden sugerido: por `id`, es decir, en el orden en que se cargaron.
- **Detalle:** los datos de la aplicación y una tabla con sus despliegues (versión, ambiente, modalidad, proveedor de nube, ubicación y desde cuándo). **Aquí se ve la relación entre las dos tablas.** Orden sugerido de los despliegues: `DEV`, `QA`, `PROD`. Debajo, el formulario de alta de despliegue (sección 4).
- **Confirmación:** después de crear, la página de destino muestra un aviso ("Aplicación creada", "Despliegue creado"). Por ejemplo, redirigiendo a `/aplicaciones/7?creada=1` y mostrando el aviso cuando viene ese parámetro.
- **Resumen de la carga:** cuántas aplicaciones y cuántos despliegues se crearon, la lista de aplicaciones creadas (con enlace a su detalle) y un enlace a la lista.

> En Express, la ruta `/aplicaciones/nueva` se declara **antes** que `/aplicaciones/:id`. Si no, "nueva" se tomaría como un id.

## 4. Formularios

Los campos salen del modelo ([`db/schema.sql`](../db/schema.sql)). El atributo `name` de cada campo del formulario es el nombre de la columna. En los textos se quitan los espacios del inicio y del final; un texto opcional que queda vacío se guarda como `NULL`.

**Alta de aplicación** (`POST /aplicaciones`):

| Campo | Control | Obligatorio | Valores permitidos |
|---|---|---|---|
| `nombre` | Texto | Sí | 1 a 100 caracteres. Único en el catálogo (si se repite, `409`) |
| `descripcion` | Texto largo | No | Libre |
| `origen` | Lista de selección | Sí | `PROPIA`, `PROVEEDOR` |
| `equipo_responsable` | Texto | Sí | 1 a 100 caracteres |
| `activa` | Casilla de verificación | No | Marcada por defecto. Si llega desmarcada, `false` |

`id` y `fecha_registro` no van en el formulario: los asigna la base de datos.

**Alta de despliegue** (`POST /aplicaciones/:id/despliegues`), en la página de detalle:

| Campo | Control | Obligatorio | Valores permitidos |
|---|---|---|---|
| `version` | Texto | Sí | 1 a 30 caracteres |
| `ambiente` | Lista de selección | Sí | `DEV`, `QA`, `PROD`. **Solo los ambientes libres** de esa aplicación |
| `modalidad` | Lista de selección | Sí | `ON_PREMISE`, `NUBE`, `SAAS` |
| `proveedor_nube` | Lista de selección | **Solo con `NUBE`** | `AWS`, `AZURE`, `GCP`, `OTRO`. Con otra modalidad debe ir vacío |
| `ubicacion` | Texto | No | Hasta 100 caracteres (región de la nube o datacenter) |
| `desplegado_en` | Fecha y hora | No | Si se deja vacío, la fecha y hora del alta |

- `origen`, `ambiente`, `modalidad` y `proveedor_nube` son **listas de selección**, no texto libre.
- `proveedor_nube` se muestra (y es obligatorio) solo cuando la modalidad es `NUBE`.
- Una aplicación tiene **un despliegue por ambiente** como máximo. La lista de ambientes muestra solo los libres; si la aplicación ya tiene los 3, el formulario no se muestra y se indica que no quedan ambientes libres.
- El navegador puede anticipar validaciones, pero **el servidor valida siempre** y es quien manda.
- Si hay un error, el formulario vuelve con **lo que el usuario escribió** y el error marcado junto al campo ([errores.md](../docs/errores.md#2-cómo-se-muestra-un-error)).

## 5. Carga de un archivo CSV

El usuario sube un archivo CSV desde `/carga` y la aplicación crea todas las aplicaciones y sus despliegues de una vez, **todo o nada**. Decisión y alternativas en el [ADR-0006](../docs/adr/0006-carga-masiva-csv.md).

El formulario usa `enctype="multipart/form-data"` y el campo del archivo se llama `archivo`.

### Formato

**Una fila por despliegue.** Encabezado obligatorio con estas 11 columnas:

```csv
nombre,descripcion,origen,equipo_responsable,activa,version,ambiente,modalidad,proveedor_nube,ubicacion,desplegado_en
```

| Columna | De | Obligatoria | Valores |
|---|---|---|---|
| `nombre` | Aplicación | Sí | 1 a 100 caracteres. Agrupa las filas |
| `descripcion` | Aplicación | No | Libre |
| `origen` | Aplicación | Sí | `PROPIA`, `PROVEEDOR` |
| `equipo_responsable` | Aplicación | Sí | 1 a 100 caracteres |
| `activa` | Aplicación | No | `true` o `false`. Vacío = `true` |
| `version` | Despliegue | Sí, si la fila trae despliegue | 1 a 30 caracteres |
| `ambiente` | Despliegue | Sí, si la fila trae despliegue | `DEV`, `QA`, `PROD` |
| `modalidad` | Despliegue | Sí, si la fila trae despliegue | `ON_PREMISE`, `NUBE`, `SAAS` |
| `proveedor_nube` | Despliegue | Solo con `NUBE` | `AWS`, `AZURE`, `GCP`, `OTRO`. Con otra modalidad, vacío |
| `ubicacion` | Despliegue | No | Hasta 100 caracteres |
| `desplegado_en` | Despliegue | No | ISO 8601: `2026-10-16` o `2026-10-16T15:30:00Z`. Vacío = fecha y hora de la carga |

### Reglas de lectura

1. **Agrupación por nombre.** Las filas con el mismo `nombre` (exacto) son **la misma aplicación**. Sus datos de aplicación salen de la **primera** fila con ese nombre; en las siguientes, las columnas de aplicación se ignoran y solo aportan un despliegue. Un nombre repetido en el archivo no es un error.
2. **Aplicación sin despliegues:** una fila con las 6 columnas de despliegue vacías. Si cualquiera de esas 6 tiene valor, la fila trae un despliegue y se valida completo.
3. **Encabezado:** obligatorio, con esos 11 nombres exactos. Las columnas se leen por nombre, así que el orden puede variar, pero no pueden faltar, sobrar ni tener otro nombre (`400`).
4. **Separador:** coma o punto y coma (Excel en español guarda con punto y coma). Se detecta en la primera línea: si contiene `;`, el separador es `;`; si no, `,`.
5. **Codificación:** UTF-8, con o sin BOM (Excel lo agrega). Un valor que contiene el separador va entre comillas dobles. Se quitan los espacios del inicio y del final de cada valor, y las líneas vacías se ignoran.
6. **Tope:** como máximo `MAX_FILAS_CSV` filas de datos (100 por defecto; el encabezado no cuenta). Si se supera, `413` sin guardar nada. Un archivo vacío o solo con el encabezado da `400`.
7. **Todo o nada, fila por fila y en orden:** todo va en **una sola transacción**. Cada fila se valida (formato, reglas R1 y R2) y se guarda. El primer error corta: `ROLLBACK`, no se guarda nada y la página de carga indica la **fila** (el encabezado es la fila 1; la primera fila de datos, la 2) y la **columna**.
8. **Conflictos:** un `nombre` que ya existe en la base da `409` en la primera fila donde aparece. Un ambiente repetido para la misma aplicación da `409` en la fila donde se repite.
9. **Mismas validaciones que el alta individual**, para tener una sola lógica.

### Ejemplo

```csv
nombre,descripcion,origen,equipo_responsable,activa,version,ambiente,modalidad,proveedor_nube,ubicacion,desplegado_en
Portal de Proveedores,Portal para proveedores,PROPIA,Compras,true,1.0.0,PROD,NUBE,AZURE,brazilsouth,
Portal de Proveedores,Portal para proveedores,PROPIA,Compras,true,1.1.0-rc1,QA,NUBE,AZURE,brazilsouth,
Herramienta de Tickets,,PROVEEDOR,Soporte,true,2026.1,PROD,SAAS,,,
Inventario Interno,Inventario de equipos,PROPIA,Operaciones,false,,,,,,
```

Crea 3 aplicaciones y 3 despliegues: "Portal de Proveedores" con 2 (`PROD` y `QA`), "Herramienta de Tickets" con 1 (`SAAS`, sin proveedor) e "Inventario Interno" sin despliegues.

En [`docs/datos/`](../docs/datos/) están `plantilla.csv` (el encabezado y unas filas de ejemplo como las de arriba) y `aplicaciones-video.csv` (15 aplicaciones; con la base vacía debe cargar sin errores).

### Sugerencias de implementación

No son obligatorias; son las opciones habituales en Node.js:

- **`multer`** para recibir el archivo, con `multer.memoryStorage()` y `upload.single('archivo')`: el contenido queda en `req.file.buffer` y no se escribe nada en el disco del contenedor.
- **`csv-parse`** (`csv-parse/sync`) para leerlo, con las opciones `delimiter`, `bom: true`, `trim: true` y `skip_empty_lines: true`.
- **La transacción en `pg`** se hace con **un solo cliente** del *pool*: `const cliente = await pool.connect()`, luego `BEGIN`, los `INSERT`, `COMMIT` o `ROLLBACK`, y al final `cliente.release()`. Con `pool.query` cada consulta podría ir por una conexión distinta y la transacción no funcionaría. Los repositorios reciben ese cliente como parámetro.

## 6. Reglas de negocio y errores

- **R1:** si `modalidad` es `NUBE`, `proveedor_nube` es obligatorio (`422`).
- **R2:** si `modalidad` es `ON_PREMISE` o `SAAS`, `proveedor_nube` debe ir vacío (`422`).
- **`409` por nombre** (`campo: nombre`): ya existe una aplicación con ese nombre.
- **`409` por ambiente** (`campo: ambiente`): la aplicación ya tiene un despliegue en ese ambiente.

La base de datos también tiene estas restricciones (`CHECK` y `UNIQUE`), como última línea de defensa: el servicio traduce sus errores (`SQLSTATE`) a estos códigos. Todo lo demás (códigos HTTP, estructura `codigo`, `mensaje` y `detalles`, cómo se muestra cada error, orden de validación y traducción de la base de datos) está en **[errores.md](../docs/errores.md)**.

## 7. Capas

Las carpetas de las capas **no existen todavía**: las crea quien desarrolla, con esta estructura y estas responsabilidades.

| Capa | Carpeta a crear | Responsabilidad | No debe |
|---|---|---|---|
| Vistas | `src/views` | Plantillas: arman la página HTML con los datos que reciben. El motor lo elige quien desarrolla (por ejemplo, EJS) | Contener reglas de negocio ni SQL |
| Rutas (controladores) | `src/routes` | Reciben la petición, el formulario o el archivo; validan el formato; llaman al servicio; eligen qué página mostrar y con qué código HTTP | Contener reglas de negocio ni SQL |
| Servicios | `src/services` | Reglas R1 y R2, orden de las validaciones, transacciones (la carga del CSV) y traducción de los errores de la base | Conocer HTTP (`req`, `res`) ni las vistas |
| Repositorios | `src/repositories` | Consultas SQL a PostgreSQL con el *pool* de `pg` | Decidir reglas de negocio |
| Archivos estáticos | `src/public` | CSS e imágenes, servidos tal cual | — |

`src/index.js` sigue siendo el punto de entrada (es el que ejecuta el `Dockerfile`). Ahí se configuran el motor de plantillas, los estáticos y la lectura de los formularios; se montan las rutas; y, **al final**, después de todas las rutas, se registran el manejador de rutas inexistentes (`404`) y el manejador global de errores (`500` o `503`), los dos con la página de error propia.

Las dependencias van en un solo sentido: rutas → servicios → repositorios, y las rutas eligen la vista. La validación de una aplicación y de un despliegue se escribe **una sola vez** y la usan tanto el alta individual como la carga del CSV.

Una organización posible (sugerencia): `src/routes/aplicaciones.js` y `src/routes/carga.js`; `src/services/aplicaciones.js` y `src/services/carga.js`; `src/repositories/aplicaciones.js` y `src/repositories/despliegues.js`; las vistas `lista`, `detalle`, `nueva`, `carga`, `resumen-carga` y `error` (la página de error propia), con las partes comunes (cabecera y menú) en `src/views/partes/`. Como los repositorios necesitan el *pool*, conviene sacarlo de `src/index.js` a un módulo propio (por ejemplo, `src/repositories/conexion.js`), y la lectura de las variables a otro (por ejemplo, `src/config.js`).

Express 5 pasa al manejador de errores las promesas rechazadas de las rutas `async`, así que no hace falta envolverlas en `try`/`catch` solo para eso.

## 8. Variables de entorno

Hoy se leen al principio de `src/index.js`, cada una con su valor por defecto. Deben leerse en **un solo lugar** (ese, o el módulo de configuración si se separa; sección 7). Para agregar una, se suma allí con su valor por defecto y se avisa al grupo, porque también va en `docker-compose.yml` y, si es configurable, en `.env.example`.

| Variable | Para qué | En Docker (Compose) | En local (valor por defecto en el código) |
|---|---|---|---|
| `PORT` | Puerto en que escucha la aplicación | `3000` | `3000` |
| `DB_HOST` | Dirección de la base de datos | `db` (el nombre del servicio) | `localhost` |
| `DB_PORT` | Puerto de la base de datos | `5432` (dentro de la red) | `5432` (el publicado por `db`) |
| `DB_NAME` | Nombre de la base | `catalogo` | `catalogo` |
| `DB_USER` | Usuario | `catalogo` | `catalogo` |
| `DB_PASSWORD` | Contraseña (solo de desarrollo) | `catalogo_dev` | `catalogo_dev` |
| `MAX_FILAS_CSV` | Máximo de filas de datos de un CSV | `100` | `100` |

En Docker, Compose toma `DB_NAME`, `DB_USER` y `DB_PASSWORD` de `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`, y `MAX_FILAS_CSV` de `.env` si existe. La aplicación **no lee** el archivo `.env`: en local, los valores por defecto ya coinciden con los de [`.env.example`](../.env.example).

## 9. Cómo correrla

### En la máquina, contra la base de Docker

Requisitos: Node.js 20 o superior y Docker Desktop abierto. Desde la raíz del repositorio:

```bash
docker compose up -d db          # levanta solo la base (publica 127.0.0.1:5432)
docker compose run --rm seed     # opcional: carga 4 aplicaciones de ejemplo
cd app
npm install                      # instala las dependencias y genera package-lock.json
npm start                        # arranca en http://localhost:3000
```

- La aplicación se conecta a `localhost:5432` con los valores por defecto. `http://localhost:3000/health` debe responder `{"estado":"ok"}`.
- Para que se reinicie sola al guardar cambios: `node --watch src/index.js`.
- `Ctrl+C` la detiene. La base sigue corriendo hasta `docker compose down`.
- Si el contenedor `app` también está corriendo, ocupa el 3000: se detiene antes con `docker compose stop app`.
- Si se cambió `DB_PORT` en `.env` (por ejemplo, a 5433), hay que pasárselo a la aplicación: en PowerShell `$env:DB_PORT="5433"; npm start`; en bash `DB_PORT=5433 npm start`.

### Todo en Docker

```bash
docker compose up -d --build     # construye la imagen y levanta db y app
docker compose logs -f app       # mensajes de la aplicación en vivo (Ctrl+C para salir)
```

Abrir `http://localhost:3000`. Después de cambiar el código, se reconstruye solo la aplicación con `docker compose up -d --build app`.

## 10. Convenciones

- **Español** en el código (nombres de variables, funciones y archivos), los comentarios y la interfaz. Sin tildes ni eñes en los identificadores (`aplicacion`, `despliegue`); en los textos de la interfaz, sí.
- **Sin ORM:** el SQL va en `src/repositories`, escrito a mano con el paquete `pg` y siempre con **parámetros** (`$1`, `$2`...), nunca concatenando texto del usuario.
- **El esquema vive en `db/schema.sql`:** la aplicación no crea ni modifica tablas.
- **No cambiar `Dockerfile` ni `docker-compose.yml` sin avisar al grupo.**
- **Logs a la salida estándar** (`console.log` y `console.error`): se ven con `docker compose logs app`.
- **Nunca mostrar trazas**, SQL ni mensajes de la base al usuario: van al log.
- **Commitear `package-lock.json`.** Las dependencias nuevas se agregan con `npm install <paquete>`, que actualiza `package.json` y el lock.

## 11. Requisitos del contenedor

El esqueleto y el `Dockerfile` ya los cumplen; el desarrollo no debe romperlos:

1. **Escuchar en `0.0.0.0`**, no en `localhost`: si no, nadie puede conectarse desde fuera del contenedor.
2. **Puerto** tomado de la variable `PORT`.
3. **Todo por variables de entorno:** ninguna credencial ni dirección escrita en el código.
4. **Terminar bien con `SIGTERM`:** `docker stop` la envía; la aplicación cierra el servidor y el *pool* y sale.
5. **Logs a la salida estándar.**
6. **Imagen liviana:** dos etapas, solo dependencias de producción (`npm ci --omit=dev` cuando existe `package-lock.json`), usuario sin privilegios `node` y un `.dockerignore` que deja fuera `node_modules`, `.env` y los README.

## 12. Interfaz

El aspecto, los estilos y la experiencia de uso quedan a criterio de quien desarrolla.

## 13. Criterios de aceptación

- [ ] `docker compose up -d --build` levanta `app` sin pasos manuales, y `http://localhost:3000` lleva a la lista.
- [ ] `GET /health` responde `200`; con la base detenida (`docker compose stop db`), `503`.
- [ ] La lista muestra los datos básicos y la cantidad de despliegues, y busca por nombre con `?q=`.
- [ ] Se puede crear una aplicación y verla en la lista y en su detalle.
- [ ] Se puede crear un despliegue desde el detalle, y el detalle muestra la tabla de despliegues de la aplicación.
- [ ] La página de ingreso y la de lista son enlaces distintos.
- [ ] El alta de despliegue ofrece solo los ambientes libres y no se ofrece si la aplicación ya tiene los 3.
- [ ] `proveedor_nube` solo se pide con `NUBE`; R1 y R2 dan `422`.
- [ ] Un nombre repetido da `409` marcado en `nombre`; un ambiente repetido, `409` marcado en `ambiente`.
- [ ] Ante un error, el formulario conserva lo escrito y la respuesta lleva el código HTTP de [errores.md](../docs/errores.md).
- [ ] La carga acepta CSV separados por coma y por punto y coma, agrupa las filas por nombre y es todo o nada.
- [ ] Un error en la carga indica la fila y la columna, y no guarda nada.
- [ ] Un archivo con más de `MAX_FILAS_CSV` filas da `413`.
- [ ] `docs/datos/aplicaciones-video.csv` carga sus 15 aplicaciones sin errores con la base vacía.
- [ ] Una ruta inexistente muestra la página `404` propia; ninguna página muestra trazas ni mensajes de la base.
- [ ] `package-lock.json` está commiteado y la imagen se construye con `npm ci`.
- [ ] `docker compose stop app` detiene la aplicación al instante.
