# Frontend (interfaz web)

Aquí va la interfaz del catálogo. **El framework lo elige quien la desarrolle** ([ADR-0010](../docs/adr/0010-stack-del-frontend.md)), incluso puede ser HTML, CSS y JavaScript sin framework. Lo que sigue es lo que debe hacer y cómo debe empaquetarse.

La rúbrica premia una interfaz gráfica con "diseño agradable" y buenos estándares de UX/UI, y exige que **se vea la relación entre las dos tablas**.

## Pantallas

| Pantalla | Qué muestra o permite | Endpoints |
|---|---|---|
| **Lista** | Aplicaciones con nombre, origen, equipo, estado, fecha de registro y cantidad de despliegues. Filtros por origen, modalidad y estado, y búsqueda por nombre | `GET /api/v1/aplicaciones` |
| **Detalle** | Los datos de la aplicación y una tabla con **sus despliegues** (versión, ambiente, modalidad, nube, ubicación, fecha). Aquí se ve la relación entre las tablas | `GET /api/v1/aplicaciones/{id}` |
| **Alta de aplicación** | Formulario de creación | `POST /api/v1/aplicaciones` |
| **Alta de despliegue** | Formulario desde el detalle de una aplicación | `POST /api/v1/aplicaciones/{id}/despliegues` |
| **Carga masiva** | Un campo para pegar (o subir) un arreglo JSON y un botón para enviarlo. Muestra el resumen o el error con su `indice` | `POST /api/v1/aplicaciones/lote` |
| **Editar y eliminar** (si hay tiempo) | Desde el detalle, con confirmación antes de eliminar | `PUT` y `DELETE` |

La pantalla de ingreso de datos y la de lista deben ser **enlaces distintos**: la actividad pide mostrar lo guardado en un enlace diferente al del ingreso.

## Comportamiento de los formularios

- `origen`, `ambiente`, `modalidad` y `proveedor_nube` son listas de selección con los valores del contrato, no texto libre.
- `proveedor_nube` solo se muestra (y es obligatorio) cuando la modalidad es `NUBE`.
- `SAAS` solo tiene sentido para aplicaciones de origen `PROVEEDOR`. Se puede anticipar en la interfaz, pero **la API es quien manda**: siempre hay que mostrar sus errores.
- Un ejemplo de JSON para la carga masiva está en [`openapi.yaml`](../docs/api/openapi.yaml), en el endpoint `/aplicaciones/lote`.

## Manejo de errores

Toda respuesta de error trae `codigo`, `mensaje` y, a veces, `detalles` ([errores.md](../docs/errores.md)). Qué hacer:

- Mostrar `mensaje` al usuario. Decidir con `codigo`, no con el texto.
- Si hay `detalles[].campo`, resaltar ese campo del formulario.
- En la carga masiva, mostrar la posición `indice` del elemento con problema.
- `SERVICIO_NO_DISPONIBLE` y `ERROR_INTERNO`: mensaje amable y opción de reintentar.

## Lista de UX/UI propuesta

La rúbrica pide "todos los estándares UX/UI" sin definirlos ([pendientes.md](../docs/pendientes.md)). Mientras se confirma con el tutor, se propone cumplir como mínimo:

- [ ] Estado de **carga** mientras se espera a la API.
- [ ] Estado **vacío** con un mensaje claro cuando no hay datos.
- [ ] Estado de **error** visible y comprensible.
- [ ] Validación de formularios **antes de enviar**, con mensajes junto al campo.
- [ ] Confirmación al eliminar, y confirmación visible al guardar.
- [ ] Navegación clara entre lista, detalle y formularios.
- [ ] Diseño consistente (tipografía, colores y espaciado) y legible, con contraste suficiente.
- [ ] Se ve bien en pantallas de distinto tamaño.

## Requisitos del contenedor

Hay que entregar un `frontend/Dockerfile`. Con cualquier herramienta deben cumplirse estos puntos:

1. **Sirve la interfaz en el puerto 80 del contenedor.** Compose lo publica en el 3000 de la máquina.
2. **Un solo contenedor, un solo proceso:** por ejemplo, construir los archivos estáticos en una etapa (*multi-stage build*) y servirlos con un servidor web liviano en la etapa final.
3. **URL de la API configurable**, sin editar código: Compose entrega `API_BASE_URL` (como argumento de construcción y como variable de entorno). Según el framework, se usa una u otra. Valor por defecto: `http://localhost:8080`. El navegador llama a esa URL directamente.
4. Un `.dockerignore` que excluya dependencias locales (por ejemplo, `node_modules`).

## Criterios de aceptación

- [ ] `docker compose up -d --build` levanta la interfaz sin pasos manuales, en `http://localhost:3000`.
- [ ] Se puede crear una aplicación con despliegues, verla en la lista y ver sus despliegues en el detalle.
- [ ] La carga masiva funciona y los errores muestran el `indice`.
- [ ] Los mensajes de error de la API se muestran al usuario.
- [ ] Se cumple la lista de UX/UI propuesta.
