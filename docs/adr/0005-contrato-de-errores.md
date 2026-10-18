# ADR-0005: Formato único de errores y mapeo a códigos HTTP

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

Si cada página o cada acción inventa sus propios errores, el usuario los ve de formas distintas y no hay una manera uniforme de explicarlos ni de probarlos. Hay que fijar una tabla de códigos y una forma de mostrarlos antes de implementar.

La aplicación arma las páginas en el servidor y no expone una API de datos ([ADR-0003](0003-aplicacion-monolitica-en-capas.md)), así que los errores no viajan en JSON: se muestran en la página que corresponde.

## Decisión

Todo error se clasifica con un código HTTP de esta tabla, que tiene asociado un `codigo` estable, en mayúsculas:

| HTTP | `codigo` |
|---|---|
| 400 | `PETICION_INVALIDA` |
| 404 | `NO_ENCONTRADO` |
| 409 | `CONFLICTO` |
| 413 | `LOTE_EXCEDE_LIMITE` |
| 422 | `REGLA_NEGOCIO` |
| 500 | `ERROR_INTERNO` |
| 503 | `SERVICIO_NO_DISPONIBLE` |

La aplicación responde con ese código HTTP y **muestra solo un `mensaje`** de texto legible en la página que corresponde (el formulario con lo que se escribió, el detalle de la aplicación, la lista, la página de carga o una página de error propia). No se muestra el `codigo` ni una lista de detalles, ni se marcan los campos con problema. En la carga de un archivo CSV, la fila (con el encabezado como fila 1) y la columna van dentro del texto, por ejemplo: `Fila 5, columna "proveedor_nube": Es obligatorio para modalidad NUBE y debe ser AWS, AZURE, GCP u OTRO.`

La estructura `codigo`, `mensaje` y `detalles` solo aparece en la única respuesta en JSON, `GET /health`, cuando responde `503` (`SERVICIO_NO_DISPONIBLE`).

Convenciones:

- **400 frente a 422:** 400 cuando la petición o el archivo no se pueden procesar: id no numérico, búsqueda demasiado larga, o un archivo ausente, vacío, de más de 2 MB, mal formado, con el encabezado incorrecto o con una fila que no tiene las 11 columnas. 422 cuando un valor del formulario o de una fila no es válido: obligatorio vacío, valor fuera de la lista, texto demasiado largo, fecha inválida o incumplimiento de las reglas R1 y R2.
- Un `500` **nunca** muestra trazas ni mensajes de la base de datos: el detalle va al log.
- Con la base de datos caída, las páginas responden `500` con un mensaje amable; solo `GET /health` responde `503`.

El detalle completo (por página, reglas, orden de validación y traducción de errores de la base de datos) está en [errores.md](../errores.md).

## Alternativas consideradas

- **Usar solo 400 para todo error del usuario.** Más simple, pero pierde la diferencia entre "no se puede procesar" y "un valor no es válido".
- **Mostrar en la página la estructura completa** (`codigo`, `mensaje` y `detalles`, marcando el campo con problema). Es más completo, pero exige más trabajo en cada vista. Se eligió clasificar con el código HTTP y mostrar solo el texto, para mantenerlo simple; la fila y la columna de la carga caben en el propio mensaje.
- **Problem Details (RFC 9457).** Es el estándar para errores de APIs HTTP en JSON. Deja de aplicar: la aplicación no expone una API de datos.

## Consecuencias

- Las vistas solo necesitan mostrar un texto; no marcan el campo con problema, así que el usuario lo identifica por el mensaje.
- El código HTTP de cada respuesta refleja el error, así que se puede comprobar desde las herramientas del navegador o con `curl`.
- Este ADR y [errores.md](../errores.md) deben mantenerse de acuerdo.
