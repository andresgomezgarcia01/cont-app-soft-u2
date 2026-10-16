# Frontend (interfaz web)

Aquí va la interfaz del catálogo. **El framework lo elige quien la desarrolle** ([ADR-0010](../docs/adr/0010-stack-del-frontend.md)), incluso puede ser HTML, CSS y JavaScript sin framework. Lo que sigue es lo que debe hacer y cómo debe empaquetarse.

La rúbrica premia una interfaz gráfica con "diseño agradable" y buenos estándares de UX/UI, y exige que **se vea la relación entre las dos tablas**.

## Pantallas

| Pantalla | Qué muestra o permite | Endpoints |
|---|---|---|
| **Lista** | Aplicaciones con nombre, origen, equipo, estado, fecha de registro y cantidad de despliegues. Búsqueda por nombre | `GET /api/v1/aplicaciones` |
| **Detalle** | Los datos de la aplicación y una tabla con **sus despliegues** (versión, ambiente, modalidad, nube, ubicación, fecha). Aquí se ve la relación entre las tablas | `GET /api/v1/aplicaciones/{id}` |
| **Alta de aplicación** | Formulario de creación | `POST /api/v1/aplicaciones` |
| **Alta de despliegue** | Formulario desde el detalle de una aplicación. Solo ofrece los ambientes libres; si la aplicación ya tiene los 3, el alta queda deshabilitada | `POST /api/v1/aplicaciones/{id}/despliegues` |
| **Carga masiva** | Un campo para pegar (o subir) un arreglo JSON y un botón para enviarlo. Muestra el resumen o el error con su `indice` | `POST /api/v1/aplicaciones/lote` |

La pantalla de ingreso de datos y la de lista deben ser **enlaces distintos**: la actividad pide mostrar lo guardado en un enlace diferente al del ingreso.

La base es **crear y consultar**: no hay pantallas para editar ni eliminar. Si el grupo decide el CRUD completo, se agregan como incremento ([pendientes.md](../docs/pendientes.md), #11).

## Comportamiento de los formularios

- `origen`, `ambiente`, `modalidad` y `proveedor_nube` son listas de selección con los valores del contrato, no texto libre.
- `proveedor_nube` solo se muestra (y es obligatorio) cuando la modalidad es `NUBE`.
- Una aplicación tiene como máximo un despliegue por ambiente (`DEV`, `QA`, `PROD`). En el alta, la lista de ambientes muestra solo los libres.
- La interfaz puede anticipar las validaciones, pero **la API es quien manda**: siempre hay que mostrar sus errores.
- Un ejemplo de JSON para la carga masiva está en [`openapi.yaml`](../docs/api/openapi.yaml), en el endpoint `/aplicaciones/lote`.

## Manejo de errores

Toda respuesta de error trae `codigo`, `mensaje` y, a veces, `detalles` ([errores.md](../docs/errores.md)). Qué hacer:

- Mostrar `mensaje` al usuario. Decidir con `codigo`, no con el texto.
- Si hay `detalles[].campo`, resaltar ese campo del formulario. Un `409` con `campo: ambiente` ("La aplicación ya tiene un despliegue en PROD") se muestra junto a la lista de ambientes.
- En la carga masiva, mostrar la posición `indice` del elemento con problema.
- `SERVICIO_NO_DISPONIBLE` y `ERROR_INTERNO`: mensaje amable y opción de reintentar.
- Si la API está caída, nginx responde `502` o `504`, sin el JSON de error. Se trata como `SERVICIO_NO_DISPONIBLE`.

## Lista de UX/UI propuesta

La rúbrica pide "todos los estándares UX/UI" sin definirlos ([pendientes.md](../docs/pendientes.md)). Mientras se definen con el grupo, se propone cumplir como mínimo:

- [ ] Estado de **carga** mientras se espera a la API.
- [ ] Estado **vacío** con un mensaje claro cuando no hay datos.
- [ ] Estado de **error** visible y comprensible.
- [ ] Validación de formularios **antes de enviar**, con mensajes junto al campo.
- [ ] Confirmación visible al guardar.
- [ ] Navegación clara entre lista, detalle y formularios.
- [ ] Diseño consistente (tipografía, colores y espaciado) y legible, con contraste suficiente.
- [ ] Se ve bien en pantallas de distinto tamaño.

## Requisitos del contenedor

`frontend/Dockerfile`, `frontend/nginx.conf` y `frontend/.dockerignore` **ya están** y cumplen los puntos de abajo. Hoy la imagen sirve la página por defecto de nginx, con el reenvío de `/api/` activo. Cuando se elija el framework, solo hay que activar las líneas comentadas del `Dockerfile`:

- **Con framework** (React + Vite, Angular...): la etapa `build` y `COPY --from=build`, ajustando la carpeta de salida (Vite: `dist/`; Angular: `dist/<proyecto>/browser/`).
- **Sin framework:** poner los archivos en `frontend/public/` y activar `COPY public/`.

`nginx.conf` devuelve `index.html` para cualquier ruta que no sea un archivo, así que las rutas de una SPA funcionan al recargar. Para probar la interfaz sin la API: `docker compose up -d --build --no-deps web`.

Puntos que se cumplen:

1. **Sirve la interfaz en el puerto 80 del contenedor.** Compose lo publica en el 3000 de la máquina.
2. **Un solo contenedor, un solo proceso:** por ejemplo, construir los archivos estáticos en una etapa (*multi-stage build*) y servirlos con nginx en la etapa final.
3. **nginx reenvía `/api/` a `http://api:8080`** (proxy inverso, [ADR-0011](../docs/adr/0011-interfaz-reenvia-llamadas-a-la-api.md)). El frontend llama con rutas relativas (`/api/v1/...`): no lleva escrita la URL de la API ni necesita configurarla.
4. Un `.dockerignore` que excluya dependencias locales (por ejemplo, `node_modules`).
5. **En la configuración de nginx**, usar `resolver 127.0.0.11` (el DNS interno de Docker) y poner la URL de la API en una variable. Así nginx vuelve a resolver el nombre `api` y no se queda con una IP vieja si se recrea el contenedor. Si la API está caída, nginx responde `502` o `504`: el frontend lo trata como `SERVICIO_NO_DISPONIBLE` (ver [Manejo de errores](#manejo-de-errores)).

## Criterios de aceptación

- [ ] `docker compose up -d --build` levanta la interfaz sin pasos manuales, en `http://localhost:3000`.
- [ ] Se puede crear una aplicación con despliegues, verla en la lista y ver sus despliegues en el detalle.
- [ ] La carga masiva funciona y los errores muestran el `indice`.
- [ ] Los mensajes de error de la API se muestran al usuario, incluido el `409` por ambiente repetido.
- [ ] El alta de despliegue ofrece solo los ambientes libres y se deshabilita si la aplicación ya tiene los 3.
- [ ] Se cumple la lista de UX/UI propuesta.
