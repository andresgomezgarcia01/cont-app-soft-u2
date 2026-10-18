# Archivos CSV de carga

Este documento explica el formato de los archivos CSV que se suben para crear varias aplicaciones y sus despliegues de una vez. Sirve para armar un archivo nuevo o para revisar uno antes de cargarlo. La decisión de la carga masiva está en el [ADR-0006](../adr/0006-carga-masiva-csv.md).

## 1. Qué hay en esta carpeta

| Archivo | Contenido |
|---|---|
| [plantilla.csv](plantilla.csv) | El encabezado y unas filas de ejemplo (sección 5). Sirve como punto de partida |
| [aplicaciones-video.csv](aplicaciones-video.csv) | 15 aplicaciones y 23 despliegues para el video. Con la base vacía carga sin errores |

Para usarlos, se abre `http://localhost:3000/carga`, se elige el archivo y se sube.

## 2. Reglas del archivo

- **Encabezado obligatorio** en la primera línea, con las 11 columnas exactas de la sección 3. Pueden ir en cualquier orden, pero no pueden faltar, sobrar ni tener otro nombre.
- **Una fila por despliegue.** Cada fila tiene las 11 columnas, aunque algunas vayan vacías.
- **Las filas con el mismo `nombre` son la misma aplicación.** Sus datos de aplicación salen de la **primera** fila con ese nombre; en las siguientes, esas columnas se ignoran y la fila solo aporta un despliegue.
- **Una aplicación sin despliegues** lleva vacías las 6 columnas de despliegue. Si cualquiera de ellas tiene valor, la fila trae un despliegue y se revisa completo.
- **Separador `,` o `;`.** Se detecta en la primera línea: si contiene `;`, el separador es `;`; si no, `,`. Un valor que contiene el separador va entre comillas dobles.
- **Codificación UTF-8**, con o sin BOM. Se quitan los espacios al inicio y al final de cada valor, y las líneas vacías se ignoran.
- **Todo o nada.** El primer error corta la carga y no se guarda nada. El mensaje indica la **fila** (el encabezado es la fila 1; la primera fila de datos, la 2) y la **columna**. El archivo se revisa aplicación por aplicación, en el orden en que aparece cada nombre por primera vez.
- **Tope:** como máximo `MAX_FILAS_CSV` filas de datos (100 por defecto; el encabezado no cuenta) y un archivo de hasta 2 MB.
- **Un nombre que ya existe en el catálogo da error** y no se guarda nada. Este mensaje indica el nombre de la aplicación, no la fila.

## 3. Columnas

| Columna | De | Obligatoria | Valores |
|---|---|---|---|
| `nombre` | Aplicación | Sí | 1 a 100 caracteres. Agrupa las filas |
| `descripcion` | Aplicación | No | Libre |
| `origen` | Aplicación | Sí | `PROPIA` o `PROVEEDOR` |
| `equipo_responsable` | Aplicación | Sí | 1 a 100 caracteres |
| `activa` | Aplicación | No | `true` o `false` (en mayúsculas o minúsculas). Vacío = `true` |
| `version` | Despliegue | Sí, si la fila trae despliegue | 1 a 30 caracteres |
| `ambiente` | Despliegue | Sí, si la fila trae despliegue | `DEV`, `QA` o `PROD`. **Como máximo un despliegue por ambiente** para cada aplicación |
| `modalidad` | Despliegue | Sí, si la fila trae despliegue | `ON_PREMISE`, `NUBE` o `SAAS` |
| `proveedor_nube` | Despliegue | Solo con `NUBE` (R1) | `AWS`, `AZURE`, `GCP` u `OTRO`. Con `ON_PREMISE` o `SAAS`, vacío (R2) |
| `ubicacion` | Despliegue | No | Hasta 100 caracteres |
| `desplegado_en` | Despliegue | No | Fecha y hora en ISO 8601 (sección 4). Vacío = fecha y hora de la carga |

Los valores de `origen`, `ambiente`, `modalidad` y `proveedor_nube` van en mayúsculas, tal como aparecen en la tabla. Las reglas R1 y R2 están en [docs/errores.md](../errores.md).

## 4. Fechas (`desplegado_en`)

- Formato **ISO 8601 con zona horaria**:
  - `Z` significa UTC: `2026-09-15T10:00:00Z`;
  - para la hora de Colombia se escribe `-05:00`: `2026-09-15T05:00:00-05:00`, que es el mismo instante.
- **Sin zona** (`2026-09-15T10:00:00`), la aplicación lo interpreta como UTC.
- **Solo la fecha** (`2026-09-15`) se toma como la medianoche UTC, que en Colombia es el 14 de septiembre a las 19:00.
- **Vacío**, toma la fecha y hora de la carga.
- Los dos archivos de esta carpeta usan `Z` (UTC).
- La aplicación muestra las fechas en hora de Colombia: `2026-09-15T10:00:00Z` aparece como las 05:00 del 15 de septiembre.

## 5. Ejemplo

Es el contenido de [plantilla.csv](plantilla.csv):

```csv
nombre,descripcion,origen,equipo_responsable,activa,version,ambiente,modalidad,proveedor_nube,ubicacion,desplegado_en
Portal de Proveedores,Portal web para que los proveedores consulten pedidos y pagos,PROPIA,Compras,true,1.0.0,PROD,NUBE,AZURE,brazilsouth,2026-09-15T10:00:00Z
Portal de Proveedores,Portal web para que los proveedores consulten pedidos y pagos,PROPIA,Compras,true,1.1.0-rc1,QA,NUBE,AZURE,brazilsouth,
Herramienta de Tickets,,PROVEEDOR,Soporte,true,2026.1,PROD,SAAS,,,
Inventario Interno,Inventario de equipos de cómputo,PROPIA,Operaciones,false,,,,,,
```

Crea 3 aplicaciones y 3 despliegues:

- "Portal de Proveedores", con 2 despliegues en la nube (`PROD` y `QA`, en Azure);
- "Herramienta de Tickets", con 1 despliegue `SAAS`, sin proveedor;
- "Inventario Interno", inactiva y sin despliegues.

## 6. Ver también

- [ADR-0006](../adr/0006-carga-masiva-csv.md): por qué la carga es con un CSV y todo o nada.
- [docs/errores.md](../errores.md): códigos de error, reglas de negocio y cómo se muestran.
