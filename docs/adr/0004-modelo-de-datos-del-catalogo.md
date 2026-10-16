# ADR-0004: Modelo de datos: aplicación y despliegue (1 a N)

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

La actividad pide dos tablas con relación y dependencia entre ellas, con varios tipos de dato (entero, fecha, booleano, carácter, etc.), y que la aplicación pueda mostrar una lista y un detalle donde se vea la relación. El dominio es libre.

## Decisión

Un **catálogo de aplicaciones** con dos tablas:

- `aplicacion` (7 columnas): `id`, `nombre`, `descripcion`, `origen`, `equipo_responsable`, `activa`, `fecha_registro`.
- `despliegue` (8 columnas): `id`, `aplicacion_id`, `version`, `ambiente`, `modalidad`, `proveedor_nube`, `ubicacion`, `desplegado_en`.

Criterios que guiaron el diseño:

- Una aplicación tiene de 0 a N despliegues. Una misma aplicación puede estar, por ejemplo, en `DEV` on-premise y en `PROD` en la nube.
- `origen` (propia o de proveedor) describe a la aplicación; `modalidad` (on-premise, nube o SaaS) describe un despliegue concreto. Por eso viven en tablas distintas.
- Al eliminar una aplicación se eliminan sus despliegues (`ON DELETE CASCADE`).
- El nombre de la aplicación es único.
- `proveedor_nube` es obligatorio si y solo si la modalidad es `NUBE` (restricción `CHECK`).
- Tipos usados: entero, texto corto y largo, booleano, fecha y fecha con hora.

## Alternativas consideradas

- **Inventario de productos y stock.** Funcionaba igual, pero el catálogo de aplicaciones encaja mejor con el tema del módulo: modela justamente lo que se está desplegando.
- **Ventas (usuario, producto, compra).** Exige tres tablas o más y más desarrollo del que permite el tiempo.
- **Una sola tabla.** No cumple el requisito de dos tablas con relación.

## Consecuencias

- La regla "una aplicación `SAAS` debe ser de origen `PROVEEDOR`" cruza dos tablas, por lo que se implementa en el servicio ([errores.md](../errores.md)).
- Entre ambas tablas suman 15 columnas, con tipos variados. Hay que confirmar con el tutor si "7 columnas" es exacto o un mínimo, y cómo se cuentan los "15 datos" ([pendientes.md](../pendientes.md)).
