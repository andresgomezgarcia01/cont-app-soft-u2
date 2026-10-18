# ADR-0006: Carga masiva con un archivo CSV, todo o nada

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

En el video hay que ingresar al menos 15 aplicaciones, guardarlas en la base de datos y mostrarlas. Hacerlo una a una por el formulario es poco práctico. El grupo decidió que la carga masiva sea **subir un archivo CSV**, en lugar de pegar un JSON.

## Decisión

- **Un archivo, una fila por despliegue.** Las filas con el mismo `nombre` son la misma aplicación: sus datos de aplicación salen de la **primera** fila y las siguientes solo aportan despliegues. Un nombre repetido en el archivo no es un error.
- Una aplicación **sin despliegues** va en una fila con las columnas de despliegue vacías.
- **Encabezado obligatorio**, con estos nombres exactos:

  ```csv
  nombre,descripcion,origen,equipo_responsable,activa,version,ambiente,modalidad,proveedor_nube,ubicacion,desplegado_en
  ```

- Se aceptan **coma y punto y coma** como separador; se detecta en la primera línea.
- **Valores vacíos:** `desplegado_en` toma la fecha y hora de la carga; `activa` toma `true`.
- **Todo o nada, validando antes de guardar:** se lee y valida todo el archivo antes de guardar, aplicación por aplicación (en el orden en que aparece cada nombre por primera vez). El primer error corta y se indica la fila (con el encabezado como fila 1) y la columna. Si todo es válido, se guarda en **una sola transacción**; si algo falla al guardar, se hace `ROLLBACK` y no queda nada.
- Un `nombre` que ya existe en la base da `409` indicando el nombre, sin fila. Un ambiente repetido para la misma aplicación en el archivo da `409` en la fila donde se repite.
- Un archivo con solo el encabezado no es un error: termina con 0 aplicaciones.
- **Tope configurable** de filas: `MAX_FILAS_CSV`, 100 por defecto. Si se supera, `413`. Además, el archivo no puede pesar más de 2 MB; si pesa más, `400`.
- **Las mismas reglas que el alta individual** (obligatorios, valores permitidos, largos, R1 y R2), aplicadas en la capa de servicios (`validador-csv.js`). La fecha sin zona del CSV se toma como UTC ([docs/datos/README.md](../datos/README.md)).
- El archivo se sube desde una página de la aplicación ([ADR-0003](0003-aplicacion-monolitica-en-capas.md)), y el resultado o el error se muestra en esa misma página ([errores.md](../errores.md)).
- En `docs/datos/` hay archivos de ejemplo: una plantilla y el CSV de 15 aplicaciones para el video.

## Alternativas consideradas

- **JSON pegado en la página.** Era la versión anterior. Menos natural para quien prepara los datos, que suele trabajar con una planilla.
- **Dos archivos, uno de aplicaciones y otro de despliegues.** Obliga a relacionarlos por nombre entre archivos y complica la pantalla.
- **Una fila por aplicación, con un solo despliegue.** No muestra la relación 1 a N en la carga.
- **Carga parcial** (guardar las filas válidas y reportar las fallidas). El resultado a medias es más difícil de explicar y de probar.

## Consecuencias

- La relación 1 a N entre aplicación y despliegues se ve en la carga.
- Hay que leer y validar un archivo: tamaño, encabezado, separador, filas y tope.
- Excel en español guarda los CSV con punto y coma. El riesgo queda cubierto porque se aceptan los dos separadores.
- En el video se hacen unas 2 altas por formulario y el resto con el CSV de 15 aplicaciones.
