# ADR-0003: Aplicación monolítica en Node.js, organizada en capas

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

La actividad evalúa la contenerización. La versión anterior separaba una API REST (`api`) y un servidor web con nginx (`web`) que le reenviaba las llamadas. Eso agregaba un contrato entre dos piezas, la configuración de nginx, dos imágenes que construir y explicar, y la coordinación de la integración entre ambas piezas.

La aplicación se desarrolla como un único proyecto en Node.js.

## Decisión

- **Un monolito:** un solo proceso Node.js con Express, en un solo contenedor (`app`, puerto 3000), que sirve la interfaz y la lógica y habla con `db`.
- **Renderizado en el servidor:** las plantillas (por ejemplo, EJS) devuelven páginas completas. Los formularios y la subida del CSV se envían al servidor, que responde con la página siguiente.
- **Sin API de datos expuesta.** La única ruta técnica es `GET /health`, que indica si la aplicación llega a la base de datos.
- **Capas simples**, con dependencias en un solo sentido:

| Capa | Responsabilidad |
|---|---|
| Vistas (plantillas) | Arman la página con los datos que reciben. Sin lógica de negocio ni SQL |
| Rutas / controladores | Reciben la petición, el formulario o el archivo; llaman al servicio y eligen qué página mostrar y con qué código HTTP |
| Servicios | Validaciones (incluidas la lectura y validación del CSV), reglas de negocio R1 y R2 y transacciones, como la de la carga masiva |
| Repositorio | Consultas SQL a PostgreSQL |

- **Alcance:** crear y consultar. No se edita ni se elimina.
- La imagen de `app` es el servidor web de la aplicación: Node.js atiende HTTP en el puerto 3000.

Un monolito ordenado es la arquitectura adecuada para una aplicación pequeña de formularios y listados: es el patrón MVC clásico. No es sobreingeniería ni un paso atrás, y lo que se quiere mostrar, la contenerización, se ve igual: imagen propia, red, volumen, variables, orden de arranque y un job a pedido.

## Alternativas consideradas

- **API REST + `web` con nginx.** Era la versión anterior. Exige un contrato entre dos piezas, un proxy y dos imágenes para una aplicación pequeña.
- **API + SPA en contenedores separados, con CORS.** Suma la configuración de orígenes y la URL de la API en la interfaz, que la actividad no evalúa.
- **Monolito con renderizado en el cliente.** Obliga a exponer y mantener una API de datos que solo usa la propia página.
- **Microservicios.** Desproporcionado para este alcance.

## Consecuencias

- Hay un solo puerto de servicio.
- No hay `openapi.yaml`: no existe una API de datos que describir.
- Los errores se muestran en las páginas, con su código HTTP ([ADR-0005](0005-contrato-de-errores.md)).
- Cada acción recarga la página. Se resigna la interactividad fina, que la actividad no evalúa.
- No se puede escalar la interfaz por separado de la lógica, ni hace falta.
