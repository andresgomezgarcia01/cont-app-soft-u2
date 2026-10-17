# Errores de la aplicación

La aplicación **clasifica** cada error con un código estable y lo **muestra en la página** que corresponde, con el código HTTP de la respuesta. Este documento fija esos códigos, cuándo se usa cada uno y cómo se muestran. Se apoya en el [ADR-0005](adr/0005-contrato-de-errores.md).

La aplicación arma las páginas en el servidor y no expone una API de datos ([ADR-0003](adr/0003-aplicacion-monolitica-en-capas.md)). La única respuesta en JSON es `GET /health` (sección 4).

## 1. Qué pasa cuando sale bien

| Acción | HTTP | Resultado |
|---|---|---|
| Abrir una página (lista, detalle, formularios, carga) | 200 | La página |
| Crear una aplicación (`POST /aplicaciones`) | 302 | Redirige al detalle de la aplicación creada, con una confirmación visible |
| Crear un despliegue (`POST /aplicaciones/:id/despliegues`) | 302 | Redirige al detalle de la aplicación, con una confirmación visible |
| Cargar un archivo CSV (`POST /carga`) | 200 | La página de resumen: cuántas aplicaciones y despliegues se crearon |

Después de crear se redirige (en lugar de mostrar la página directamente) para que recargar el navegador no vuelva a enviar el formulario.

Una lista vacía **no es un error**: es un `200` con un mensaje como "No hay aplicaciones" o "Ninguna aplicación coincide con la búsqueda".

`fecha_registro` la asigna la base de datos al crear. `desplegado_en`, si se deja vacío, también: toma la fecha y hora del alta o de la carga.

## 2. Cómo se muestra un error

Todo error tiene la misma estructura:

| Elemento | Obligatorio | Descripción |
|---|---|---|
| `codigo` | Sí | Identificador estable en mayúsculas. La aplicación decide con él (qué página y qué código HTTP), no con el texto |
| `mensaje` | Sí | Texto legible, apto para mostrarse al usuario |
| `detalles` | No | Lista (puede ir vacía). Cada elemento puede traer `campo`, `fila` y `motivo` |

- `campo` es el nombre del campo del formulario (`nombre`, `ambiente`...) o, en la carga, el de la columna del CSV.
- `fila` solo aplica a la carga de un CSV: es el número de fila del archivo, con el encabezado como fila 1. La primera fila de datos es la 2.

En la página:

- el `mensaje` se ve arriba, destacado;
- cada `detalles[].campo` se marca junto a su campo del formulario, con su `motivo`;
- en la carga, se indican la **fila** y la **columna**;
- el formulario **conserva lo que el usuario escribió**;
- el `codigo` puede mostrarse de forma discreta, junto al mensaje;
- la respuesta lleva el **código HTTP** del error (sección 3), no un `200`.

Ejemplo: alta de un despliegue en `NUBE` sin proveedor. La respuesta es un `422` con el detalle de la aplicación y su formulario de despliegue:

```text
+------------------------------------------------------------------+
| Si la modalidad es NUBE, proveedor_nube es obligatorio           |
| REGLA_NEGOCIO                                                    |
+------------------------------------------------------------------+
Versión          [ 2.0.0          ]
Ambiente         [ QA           v ]
Modalidad        [ NUBE         v ]
Proveedor nube   [ (elegir)     v ]   obligatorio cuando modalidad es NUBE
```

Los errores que no tienen formulario (`404`, `500`, `503`) se muestran en una **página de error propia** de la aplicación, con el `mensaje` y un enlace para volver.

## 3. Códigos de error

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `PETICION_INVALIDA` | Campo obligatorio ausente, valor fuera de la lista permitida, texto demasiado largo, fecha inválida, id no numérico, búsqueda `q` de más de 100 caracteres. En la carga: archivo ausente o vacío, archivo que no es `.csv`, encabezado incorrecto (columnas faltantes, sobrantes o con otro nombre), archivo sin filas de datos, o una fila con un valor inválido |
| 404 | `NO_ENCONTRADO` | El id no existe (detalle o alta de despliegue), o la ruta no existe |
| 409 | `CONFLICTO` | Ya existe una aplicación con ese nombre, o la aplicación ya tiene un despliegue en ese ambiente |
| 413 | `LOTE_EXCEDE_LIMITE` | El archivo CSV trae más filas de datos que `MAX_FILAS_CSV` (100 por defecto) |
| 422 | `REGLA_NEGOCIO` | Lo enviado está bien formado pero incumple una regla de negocio (sección 5) |
| 500 | `ERROR_INTERNO` | Falla inesperada. El detalle va al log, **nunca** a la página |
| 503 | `SERVICIO_NO_DISPONIBLE` | La aplicación está en ejecución pero no llega a la base de datos. Se muestra una página de error amable con la opción de reintentar |

**400 frente a 422.** Se usa 400 cuando lo enviado está mal formado y 422 cuando está bien formado pero rompe una regla. Es una convención del proyecto: otros equipos usan solo 400.

## 4. Qué errores puede dar cada página o acción

Todas pueden dar además `500`. Las que consultan la base de datos pueden dar `503`. Ambos se muestran en la página de error propia.

| Página o acción | 400 | 404 | 409 | 413 | 422 | Dónde se muestra el error |
|---|:-:|:-:|:-:|:-:|:-:|---|
| `GET /aplicaciones` (lista y búsqueda) | x | | | | | En la lista, junto al buscador |
| `GET /aplicaciones/nueva` (formulario) | | | | | | |
| `POST /aplicaciones` (alta de aplicación) | x | | x | | | En el formulario, con lo escrito |
| `GET /aplicaciones/:id` (detalle) | x | x | | | | Página de error |
| `POST /aplicaciones/:id/despliegues` (alta de despliegue) | x | x | x | | x | En el detalle, en el formulario de despliegue con lo escrito (el `404`, en la página de error) |
| `GET /carga` (formulario de carga) | | | | | | |
| `POST /carga` (carga del CSV) | x | | x | x | x | En la página de carga, con la fila y la columna |
| Cualquier ruta inexistente | | x | | | | Página de error |

`GET /health` es la **única respuesta en JSON**: devuelve `200` con `{"estado":"ok"}` si la base de datos responde, y `503` con la estructura de la sección 2 (`codigo` `SERVICIO_NO_DISPONIBLE`) si no. No expone datos del catálogo.

El `409` aparece en dos casos, ambos con `codigo` `CONFLICTO`:

- **Nombre repetido** (`campo: nombre`): en el alta de aplicación y en la carga del CSV.
- **Ambiente repetido** (`campo: ambiente`): la aplicación ya tiene un despliegue en ese ambiente. Ocurre en el alta de despliegue y en la carga del CSV, cuando dos filas de la misma aplicación traen el mismo ambiente.

## 5. Reglas de negocio (`422`)

| Regla | Descripción | Dónde se verifica |
|---|---|---|
| R1 | Si `modalidad` es `NUBE`, `proveedor_nube` es obligatorio | Servicio y `CHECK` en la base de datos |
| R2 | Si `modalidad` es `ON_PREMISE` o `SAAS`, `proveedor_nube` debe ir vacío | Servicio y `CHECK` en la base de datos |

Se aplican al crear un despliegue y a cada fila del CSV que trae un despliegue.

## 6. Orden de las validaciones

Si lo enviado incumple varias cosas, se muestra el primer error en este orden:

1. **Formato** (`400`)
2. **Existencia** (`404`)
3. **Reglas de negocio** (`422`)
4. **Conflictos** (`409`), que se detectan al guardar

**Carga del CSV.** Antes de guardar nada se revisa el archivo: que venga y no esté vacío, que sea `.csv` y que el encabezado sea correcto (`400`), y que no supere `MAX_FILAS_CSV` filas de datos (`413`). Después se valida **fila por fila, en orden**, dentro de una sola transacción. Cada fila pasa por el orden de arriba (formato, reglas y, al guardar, conflictos). **El primer error corta:** se hace `ROLLBACK`, no se guarda nada y se indican la fila y la columna. Las filas que siguen no se evalúan.

- Un `nombre` repetido entre filas **no es un error**: es la misma aplicación. Sus datos de aplicación salen de la primera fila con ese nombre y las siguientes solo aportan despliegues ([ADR-0006](adr/0006-carga-masiva-csv.md)).
- Un `nombre` que ya existe en la base da `409` con `campo: nombre`, en la primera fila donde aparece.
- Un ambiente repetido para la misma aplicación da `409` con `campo: ambiente`, en la fila donde se repite.

## 7. Traducción de errores de la base de datos

El servicio no debe dejar escapar errores de la base de datos. Traducción recomendada, usando el código `SQLSTATE` de PostgreSQL (en Node.js con `pg`, viene en `error.code`, y el nombre de la restricción en `error.constraint`):

| `SQLSTATE` | Significado | Se traduce a |
|---|---|---|
| `23505` | `unique_violation` | 409 `CONFLICTO`. Según la restricción que falló: `uq_aplicacion_nombre` → `campo: nombre`; `uq_despliegue_aplicacion_ambiente` → `campo: ambiente` |
| `23503` | `foreign_key_violation` | 404 `NO_ENCONTRADO` (la aplicación padre no existe) |
| `23514` | `check_violation` | 422 `REGLA_NEGOCIO` (normalmente se detecta antes, en el servicio) |
| `23502` | `not_null_violation` | 400 `PETICION_INVALIDA` (normalmente se detecta antes) |
| clase `08` y errores de conexión (rechazada, tiempo agotado; en Node.js, por ejemplo, `ECONNREFUSED`) | Sin conexión | 503 `SERVICIO_NO_DISPONIBLE` |
| cualquier otro | Inesperado | 500 `ERROR_INTERNO` |

## 8. Ejemplos

**404: la aplicación no existe**

```text
GET /aplicaciones/42                         HTTP 404, página de error
codigo:   NO_ENCONTRADO
mensaje:  No existe una aplicación con id 42
```

**409: nombre duplicado**

```text
POST /aplicaciones                           HTTP 409, formulario de alta con lo escrito
codigo:   CONFLICTO
mensaje:  Ya existe una aplicación llamada CRM Comercial
detalles: campo nombre, motivo "duplicado" (se marca junto al campo Nombre)
```

**409: ambiente repetido**

```text
POST /aplicaciones/7/despliegues             HTTP 409, detalle con el formulario de despliegue
codigo:   CONFLICTO
mensaje:  La aplicación ya tiene un despliegue en PROD
detalles: campo ambiente, motivo "duplicado" (se marca junto a la lista de ambientes)
```

**422 en la carga: falla la fila 5**

```text
POST /carga                                  HTTP 422, página de carga
codigo:   REGLA_NEGOCIO
mensaje:  Fila 5, columna proveedor_nube: si la modalidad es NUBE, proveedor_nube es obligatorio
detalles: fila 5, campo proveedor_nube, motivo "obligatorio cuando modalidad es NUBE"
No se guardó ninguna fila del archivo.
```

**400 en la carga: encabezado incorrecto**

```text
POST /carga                                  HTTP 400, página de carga
codigo:   PETICION_INVALIDA
mensaje:  Al encabezado le falta la columna ambiente
detalles: fila 1, campo ambiente, motivo "columna faltante"
```

**413: archivo demasiado grande**

```text
POST /carga                                  HTTP 413, página de carga
codigo:   LOTE_EXCEDE_LIMITE
mensaje:  El archivo trae 150 filas y el máximo permitido es 100
```

## 9. Reglas para quien implementa

- Ninguna página muestra el error por defecto de Express. Hay que registrar un **manejador global** que muestre la página de error propia: para rutas inexistentes (`404` con `NO_ENCONTRADO`), para errores inesperados (`500`) y para la base de datos caída (`503`). El esqueleto de `app/src/index.js` no trae ninguno de los dos manejadores: los agrega quien desarrolla, junto con la página de error ([app/README.md](../app/README.md#2-estado)).
- Nunca se muestra una traza de pila, una consulta SQL ni el mensaje original de la base de datos. Se registran en el log del contenedor (salida estándar), donde `docker compose logs app` los muestra.
- `GET /health` es la única respuesta en JSON.
- El texto de `mensaje` puede cambiar; el `codigo` no.
