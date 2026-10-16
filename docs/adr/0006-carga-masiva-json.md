# ADR-0006: Carga masiva con JSON, todo o nada y tope configurable

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

La actividad pide ingresar 15 datos, guardarlos en la base de datos y mostrarlos desde otro enlace. Ingresar tantos registros uno a uno en un video es poco práctico, y el tiempo de desarrollo es corto.

## Decisión

- Endpoint `POST /api/v1/aplicaciones/lote` que recibe un **arreglo JSON** de aplicaciones, cada una con su arreglo opcional de `despliegues` anidado.
- **Todo o nada:** una sola transacción. Si un elemento falla, no se guarda ninguno y el error indica el `indice` del primer elemento con problema.
- **Mismas validaciones y reglas** que la creación individual, para tener una sola lógica en el servicio.
- **Validación elemento por elemento, en orden:** el primer error corta, se hace `ROLLBACK` y se reporta su `indice`. Un nombre repetido dentro del lote se reporta en la segunda aparición ([errores.md](../errores.md#6-orden-de-las-validaciones)).
- **Tope configurable:** `MAX_BATCH_SIZE`, 100 por defecto. Si se supera, responde `413` con `LOTE_EXCEDE_LIMITE`. Un arreglo vacío responde `400`.
- En el frontend, un campo donde pegar (o subir) el JSON.

El número 100 es un valor práctico y arbitrario: cubre con holgura los 15 datos de la actividad y protege la API. Se puede cambiar sin tocar código.

## Alternativas consideradas

- **Carga desde CSV.** Exige leer archivos, manejar codificaciones y expresar una relación 1 a N en un formato plano. Más desarrollo para el mismo resultado.
- **Registro uno a uno.** Inviable para el video.
- **Carga parcial** (guardar los válidos y reportar los fallidos). El resultado a medias es más difícil de explicar y de probar.
- **Validación por etapas** (primero el formato de todo el arreglo, luego las reglas y al final los duplicados). Ordena mejor los errores, pero agrega lógica que la actividad no evalúa.

## Consecuencias

- El JSON anidado crea la aplicación y sus despliegues en un solo paso, sin necesidad de conocer ids de antemano.
- No es una carga por streaming: el lote completo viaja en una sola petición.
- La carga masiva cuenta como "ingresar datos" (decisión del grupo). En el video se hacen unas 2 altas por el formulario y el resto con un JSON de 15 aplicaciones.
