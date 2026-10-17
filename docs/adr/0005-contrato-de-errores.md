# ADR-0005: Formato único de errores y mapeo a códigos HTTP

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

Si cada página o cada acción inventa sus propios errores, el usuario los ve de formas distintas y no hay una manera uniforme de explicarlos ni de probarlos. Hay que fijar una estructura y una tabla de códigos antes de implementar.

La aplicación arma las páginas en el servidor y no expone una API de datos ([ADR-0003](0003-aplicacion-monolitica-en-capas.md)), así que los errores no viajan en JSON: se muestran en la página que corresponde.

## Decisión

Todo error se describe con la misma estructura:

- `codigo`: identificador estable, en mayúsculas;
- `mensaje`: texto legible, apto para mostrarse al usuario;
- `detalles` (opcional): una lista donde cada elemento puede traer `campo`, `fila` y `motivo`. `fila` solo aplica a la carga de un archivo CSV.

La aplicación **muestra** el error en la página (el formulario con lo que se escribió, la página de carga o una página de error propia) y responde con el código HTTP de esta tabla:

| HTTP | `codigo` |
|---|---|
| 400 | `PETICION_INVALIDA` |
| 404 | `NO_ENCONTRADO` |
| 409 | `CONFLICTO` |
| 413 | `LOTE_EXCEDE_LIMITE` |
| 422 | `REGLA_NEGOCIO` |
| 500 | `ERROR_INTERNO` |
| 503 | `SERVICIO_NO_DISPONIBLE` |

Convenciones:

- **400 frente a 422:** 400 cuando lo enviado está mal formado; 422 cuando está bien formado pero incumple una regla de negocio.
- Un `500` **nunca** muestra trazas ni mensajes de la base de datos: el detalle va al log.
- La única respuesta en JSON es `GET /health`, que usa esta misma estructura cuando responde `503`.

El detalle completo (por página, reglas, orden de validación y traducción de errores de la base de datos) está en [errores.md](../errores.md).

## Alternativas consideradas

- **Usar solo 400 para todo error del usuario.** Más simple, pero pierde la diferencia entre "mal formado" y "regla de negocio".
- **Mostrar solo un texto, sin código ni estructura.** Cada página resolvería el error a su manera y no se podría marcar el campo con problema de forma uniforme.
- **Problem Details (RFC 9457).** Es el estándar para errores de APIs HTTP en JSON. Deja de aplicar: la aplicación no expone una API de datos.

## Consecuencias

- Las vistas pueden mostrar `mensaje` y marcar los campos de `detalles` sin conocer cada caso.
- El código HTTP de cada respuesta refleja el error, así que se puede comprobar desde las herramientas del navegador o con `curl`.
- Este ADR y [errores.md](../errores.md) deben mantenerse de acuerdo.
