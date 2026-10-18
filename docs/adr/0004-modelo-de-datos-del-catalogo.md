# ADR-0004: Modelo de datos: aplicación y despliegue (1 a N)

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

La actividad pide dos tablas con relación y dependencia entre ellas, con varios tipos de dato (entero, fecha, booleano, carácter, etc.), y que la aplicación pueda mostrar una lista y un detalle donde se vea la relación. El dominio es libre.

## Decisión

Un **catálogo de aplicaciones** con dos tablas:

- `aplicacion` (7 columnas): `id`, `nombre`, `descripcion`, `origen`, `equipo_responsable`, `activa`, `fecha_registro`.
- `despliegue` (8 columnas): `id`, `aplicacion_id`, `version`, `ambiente`, `modalidad`, `proveedor_nube`, `ubicacion`, `desplegado_en`.

Criterios que guiaron el diseño:

- Las "7 columnas por tabla" del enunciado se toman como un **mínimo** (decisión del grupo): por eso `despliegue` tiene 8.
- La relación es 1 a N: una aplicación puede tener varios despliegues. Una misma aplicación puede estar, por ejemplo, en `DEV` on-premise y en `PROD` en la nube.
- **Un despliegue es el estado actual**: la versión que hoy está en un ambiente. Hay como máximo un despliegue por aplicación y ambiente, es decir, de 0 a 3 por aplicación (restricción `uq_despliegue_aplicacion_ambiente UNIQUE (aplicacion_id, ambiente)`). No se guarda historial: `desplegado_en` indica desde cuándo está esa versión en ese ambiente.
- `origen` (propia o de proveedor) describe a la aplicación; `modalidad` (on-premise, nube o SaaS) describe un despliegue concreto. Por eso viven en tablas distintas.
- Al eliminar una aplicación se eliminan sus despliegues (`ON DELETE CASCADE`).
- El nombre de la aplicación es único.
- `proveedor_nube` es obligatorio si y solo si la modalidad es `NUBE` (restricción `CHECK`).
- Tipos usados: entero, texto corto y largo, booleano, fecha y fecha con hora.

## Alternativas consideradas

- **Inventario de productos y stock.** Funcionaba igual, pero el catálogo de aplicaciones encaja mejor con el tema del módulo: modela justamente lo que se está desplegando.
- **Ventas (usuario, producto, compra).** Exige tres tablas o más y más desarrollo del que permite el tiempo.
- **Una sola tabla.** No cumple el requisito de dos tablas con relación.
- **Despliegue como historial** (varias filas por aplicación y ambiente, una por versión). Permite ver la evolución, pero obliga a decidir cuál es la vigente y complica la interfaz. El estado actual alcanza para mostrar la relación entre tablas.

## Consecuencias

- Un ambiente repetido para la misma aplicación se rechaza con `409`, tanto en el alta de un despliegue (por la restricción `UNIQUE`), donde el mensaje se muestra en el detalle de la aplicación, como en la carga de un archivo CSV, donde el servicio lo detecta antes de guardar e indica la fila donde se repite ([errores.md](../errores.md)). El alcance es crear y consultar ([ADR-0003](0003-aplicacion-monolitica-en-capas.md)): un despliegue se crea y no se edita.
- Entre ambas tablas suman 15 columnas, con tipos variados.
- Los "15 datos" de la rúbrica se cumplen con **al menos 15 aplicaciones**, cada una con sus despliegues, ingresadas durante el video.
