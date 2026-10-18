# Errores de la aplicación

La aplicación **clasifica** cada error con un código HTTP (y un `codigo` estable que lo nombra) y lo **muestra en la página** que corresponde, como un mensaje de texto. Este documento fija esos códigos, cuándo se usa cada uno y cómo se muestran. Se apoya en el [ADR-0005](adr/0005-contrato-de-errores.md).

La aplicación arma las páginas en el servidor y no expone una API de datos ([ADR-0003](adr/0003-aplicacion-monolitica-en-capas.md)). La única respuesta en JSON es `GET /health` (sección 4).

## 1. Qué pasa cuando sale bien

| Acción | HTTP | Resultado |
|---|---|---|
| Abrir una página (lista, detalle, formularios, carga) | 200 | La página |
| Crear una aplicación (`POST /aplicaciones`) | 302 | Redirige a la lista de aplicaciones, sin aviso |
| Crear un despliegue (`POST /aplicaciones/:id/despliegues`) | 302 | Redirige al detalle de la aplicación, sin aviso; el despliegue nuevo aparece en la tabla |
| Cargar un archivo CSV (`POST /carga`) | 200 | La página de carga con el resumen: "Importación completada: N aplicaciones y M despliegues registrados." |

Después de crear se redirige (en lugar de mostrar la página directamente) para que recargar el navegador no vuelva a enviar el formulario.

Una lista vacía **no es un error**: es un `200` con el mensaje "No se encontraron aplicaciones.". Un archivo CSV con **solo el encabezado** tampoco: la carga termina bien con "0 aplicaciones y 0 despliegues".

`fecha_registro` la asigna la base de datos al crear. `desplegado_en`, si se deja vacío, lo asigna la aplicación con la fecha y hora del alta o de la carga.

## 2. Cómo se muestra un error

Cada página muestra el error como **un solo mensaje de texto**, en una alerta: en el alta de aplicación y en la carga, encima del formulario; en la lista, debajo del buscador; en el detalle, dentro del panel de despliegues. En la carga, la alerta agrega "No se importaron los registros. Verifica el archivo e inténtalo nuevamente.". Además:

- no se muestra el `codigo` ni una lista de detalles, ni se marca el campo con problema;
- en la carga, la **fila** y la **columna** van dentro del texto del mensaje, por ejemplo: `Fila 5, columna "proveedor_nube": Es obligatorio para modalidad NUBE y debe ser AWS, AZURE, GCP u OTRO.` La fila se cuenta con el encabezado como fila 1: la primera fila de datos es la 2;
- el formulario de alta de aplicación **conserva lo que el usuario escribió**; el formulario de despliegue, no;
- la respuesta lleva el **código HTTP** del error (sección 3), no un `200`. La excepción es el alta de despliegue con `409` o `422`, que redirige al detalle (sección 4).

Los errores que no tienen formulario (id inválido, `404` y los `500` del detalle y del alta de despliegue) se muestran en una **página de error propia** de la aplicación (`views/error.ejs`): el título "Error" con el código HTTP, el mensaje, la navegación y un enlace para volver al catálogo.

**La estructura `codigo`, `mensaje` y `detalles` solo aparece en el JSON de `GET /health`** cuando no llega a la base de datos:

| Elemento | Descripción |
|---|---|
| `codigo` | Identificador estable en mayúsculas: `SERVICIO_NO_DISPONIBLE` |
| `mensaje` | Texto legible |
| `detalles` | Lista, vacía |

```json
{
  "codigo": "SERVICIO_NO_DISPONIBLE",
  "mensaje": "La aplicación no logra conectar con la base de datos",
  "detalles": []
}
```

## 3. Códigos de error

La columna `codigo` es la clasificación de cada error. Las páginas no la muestran (solo el mensaje, con el código HTTP de la respuesta); aparece escrita únicamente en el JSON de `/health`.

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `PETICION_INVALIDA` | Id no numérico o menor o igual a 0; búsqueda `q` de más de 100 caracteres. En la carga: sin archivo, archivo de más de 2 MB u otro problema al recibirlo ("No fue posible recibir el archivo. Verifica que sea válido."), archivo vacío, CSV mal formado (incluida una fila con otro número de columnas), o encabezado que no tiene exactamente las 11 columnas (en cualquier orden) |
| 404 | `NO_ENCONTRADO` | El id no existe (detalle o alta de despliegue), o la ruta no existe |
| 409 | `CONFLICTO` | Ya existe una aplicación con ese nombre, o la aplicación ya tiene un despliegue en ese ambiente |
| 413 | `LOTE_EXCEDE_LIMITE` | El archivo CSV trae más filas de datos que `MAX_FILAS_CSV` (100 por defecto) |
| 422 | `REGLA_NEGOCIO` | Un valor inválido en un formulario o en una fila del CSV: obligatorio vacío, valor fuera de la lista permitida, texto demasiado largo, fecha inválida, o una regla de negocio (sección 5) |
| 500 | `ERROR_INTERNO` | Cualquier otra falla, **incluida la base de datos caída**. La página muestra un mensaje amable; el detalle va al log, **nunca** a la página |
| 503 | `SERVICIO_NO_DISPONIBLE` | Solo en `GET /health`: la aplicación está en ejecución pero no llega a la base de datos. Las páginas no usan `503` |

**400 frente a 422.** Se usa 400 cuando la petición o el archivo no se pueden procesar (id inválido, búsqueda demasiado larga, archivo ausente, demasiado grande, vacío, mal formado o con columnas incorrectas) y 422 cuando se pueden leer pero algún valor es inválido o rompe una regla. Es una convención del proyecto: otros equipos usan solo 400.

## 4. Qué errores puede dar cada página o acción

Las que consultan o modifican la base de datos pueden dar además `500`, también cuando la base no responde. La última columna indica dónde se muestra el error, incluido el `500`.

| Página o acción | 400 | 404 | 409 | 413 | 422 | Dónde se muestra el error |
|---|:-:|:-:|:-:|:-:|:-:|---|
| `GET /aplicaciones` (lista y búsqueda) | x | | | | | En la propia lista, debajo del buscador |
| `GET /aplicaciones/nueva` (formulario) | | | | | | |
| `POST /aplicaciones` (alta de aplicación) | | | x | | x | En el formulario, con lo escrito |
| `GET /aplicaciones/:id` (detalle) | x | x | | | | Página de error |
| `POST /aplicaciones/:id/despliegues` (alta de despliegue) | x | x | x | | x | `409` y `422`: redirige (`302`) al detalle, que muestra el mensaje en el panel de despliegues, sin conservar lo escrito. `400`, `404` y `500`: página de error |
| `GET /carga` (formulario de carga) | | | | | | |
| `POST /carga` (carga del CSV) | x | | x | x | x | En la página de carga, con la fila y la columna dentro del mensaje cuando aplican |
| Cualquier ruta inexistente | | x | | | | Página 404 propia |

En el alta de despliegue con `409` o `422` la respuesta es un `302`, no el código del error: el mensaje viaja en el parámetro `?error=` de la dirección del detalle.

`GET /health` es la **única respuesta en JSON**: devuelve `200` con `{"estado":"ok"}` si la base de datos responde, y `503` con la estructura de la sección 2 (`codigo` `SERVICIO_NO_DISPONIBLE`) si no. No expone datos del catálogo.

El `409` aparece en dos casos, ambos con `codigo` `CONFLICTO`:

- **Nombre repetido:** en el alta de aplicación y en la carga del CSV, cuando un nombre del archivo ya existe en la base. En la carga, el mensaje dice el nombre, sin fila ni columna.
- **Ambiente repetido:** en el alta de despliegue, cuando la aplicación ya tiene un despliegue en ese ambiente, y en la carga del CSV, cuando dos filas de la misma aplicación traen el mismo ambiente (el mensaje indica la fila y la columna).

## 5. Reglas de negocio (`422`)

| Regla | Descripción | Dónde se verifica |
|---|---|---|
| R1 | Si `modalidad` es `NUBE`, `proveedor_nube` es obligatorio | Servicio y `CHECK` en la base de datos |
| R2 | Si `modalidad` es `ON_PREMISE` o `SAAS`, `proveedor_nube` debe ir vacío | Servicio y `CHECK` en la base de datos |

Se aplican al crear un despliegue y a cada fila del CSV que trae un despliegue.

## 6. Orden de las validaciones

Si lo enviado incumple varias cosas, se muestra solo el primer error.

**Altas individuales**, en este orden:

1. **Formato del id** (`400`), en el alta de despliegue
2. **Existencia** (`404`): la aplicación debe existir, en el alta de despliegue
3. **Campos y reglas de negocio** (`422`): se revisan los campos uno por uno, con R1 y R2, y se muestra el primero que falla
4. **Conflictos** (`409`), que se detectan al guardar: nombre o ambiente repetido

**Carga del CSV**, en este orden:

1. **Recepción** (rutas): si no llega un archivo, supera 2 MB o no se puede recibir, `400`.
2. **Lectura** (servicio): quita el BOM, detecta el separador y omite las líneas vacías. Luego, en este orden:
   1. si el CSV está mal formado, `400` con "El archivo CSV tiene un formato inválido cerca de la línea N.". Incluye una fila con otro número de columnas que el encabezado: la librería la rechaza al leer, antes de los chequeos siguientes;
   2. si el archivo está vacío, `400`;
   3. si el encabezado no tiene exactamente las 11 columnas, `400`;
   4. si hay más filas de datos que `MAX_FILAS_CSV`, `413`.
3. **Agrupación** (servicio): las filas se agrupan por `nombre`.
4. **Validación de todo el archivo, antes de guardar nada** (servicio): aplicación por aplicación, en el orden en que aparece cada nombre por primera vez. De cada aplicación se validan primero sus datos (de su primera fila) y luego cada despliegue. Un valor inválido da `422` con la fila y la columna; un ambiente repetido dentro del archivo, `409` con la fila y la columna.
5. **Guardado** (servicio): solo si todo es válido, se abre **una** transacción. Por cada aplicación se verifica que el nombre no exista en la base y se guardan la aplicación y sus despliegues. Un nombre que ya existe da `409` con el nombre, sin fila ni columna, y se hace `ROLLBACK`. Si todo sale bien, `COMMIT`.

**El primer error corta:** no se guarda nada (todo o nada) y lo que sigue no se evalúa. Como se valida aplicación por aplicación, el error informado no es siempre el de la fila más baja del archivo.

- Un `nombre` repetido entre filas **no es un error**: es la misma aplicación. Sus datos de aplicación salen de la primera fila con ese nombre y las siguientes solo aportan despliegues ([ADR-0006](adr/0006-carga-masiva-csv.md)).
- El servidor no revisa la extensión del archivo: el formulario sugiere `.csv` al elegirlo, pero lo que cuenta es el contenido.

## 7. Traducción de errores de la base de datos

El servicio no deja escapar errores de la base de datos. Solo se traduce uno, usando el código `SQLSTATE` de PostgreSQL (en Node.js con `pg`, viene en `error.code`):

| `SQLSTATE` | Significado | Se traduce a |
|---|---|---|
| `23505` | `unique_violation` | 409 `CONFLICTO`: nombre repetido (`uq_aplicacion_nombre`) o ambiente repetido (`uq_despliegue_aplicacion_ambiente`) |
| cualquier otro, incluidos los errores de conexión (base caída, tiempo agotado) | Inesperado | 500 `ERROR_INTERNO`, con un mensaje amable en la página |

`23503` (clave foránea) no ocurre porque antes se verifica que la aplicación existe (`404`), y `23514` (`CHECK` de R1 y R2) tampoco, porque R1 y R2 se validan antes (`422`).

## 8. Ejemplos

**404: la aplicación no existe**

```text
GET /aplicaciones/42                         HTTP 404, página de error
mensaje:  La aplicación solicitada no existe.
```

**409: nombre duplicado**

```text
POST /aplicaciones                           HTTP 409, formulario de alta con lo escrito
mensaje:  Ya existe una aplicación con ese nombre.
```

**409: ambiente repetido**

```text
POST /aplicaciones/7/despliegues             HTTP 302 a /aplicaciones/7?error=...
mensaje:  La aplicación ya tiene un despliegue en el ambiente PROD.
          (se muestra en el panel de despliegues del detalle; el formulario queda vacío)
```

**422 en la carga: falla la fila 5**

```text
POST /carga                                  HTTP 422, página de carga
mensaje:  Fila 5, columna "proveedor_nube": Es obligatorio para modalidad NUBE y debe ser AWS, AZURE, GCP u OTRO.
No se importaron los registros. Verifica el archivo e inténtalo nuevamente.
```

**409 en la carga: el nombre ya existe en el catálogo**

```text
POST /carga                                  HTTP 409, página de carga
mensaje:  La aplicación "CRM Comercial" ya existe en el catálogo.
No se importaron los registros. Verifica el archivo e inténtalo nuevamente.
```

**400 en la carga: encabezado incorrecto**

```text
POST /carga                                  HTTP 400, página de carga
mensaje:  El encabezado debe contener exactamente estas columnas: nombre, descripcion, origen, equipo_responsable, activa, version, ambiente, modalidad, proveedor_nube, ubicacion, desplegado_en.
```

**413: demasiadas filas de datos**

```text
POST /carga                                  HTTP 413, página de carga
mensaje:  El archivo supera el límite de 100 filas de datos.
```

## 9. Reglas para quien implementa

- Para las rutas inexistentes hay un **manejador global** en `app/src/index.js` que muestra la página 404 propia. Es el único manejador global.
- Lo que Express rechaza antes de llegar a una ruta sale con su página por defecto (sin trazas, porque la imagen usa `NODE_ENV=production`). Son dos casos raros: una dirección mal codificada (por ejemplo, `GET /aplicaciones/%E0%A4%A`) da `400` "Bad Request", y un formulario de más de 100 kB (límite por defecto de `express.urlencoded`) da `413` "Payload Too Large".
- No hay manejador global para los errores inesperados: cada ruta atrapa sus errores (`try`/`catch`) y muestra el `500` con un mensaje amable en su propia página (sección 4). Una ruta nueva tiene que hacer lo mismo.
- Nunca se muestra una traza de pila, una consulta SQL ni el mensaje original de la base de datos. Se registran en el log del contenedor (salida estándar), donde `docker compose logs app` los muestra.
- `GET /health` es la única respuesta en JSON.
- El texto de los mensajes puede cambiar; los códigos HTTP y el `codigo` de `/health`, no.
