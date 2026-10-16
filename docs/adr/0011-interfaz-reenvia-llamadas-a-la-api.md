# ADR-0011: La interfaz reenvía las llamadas a la API

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

Antes, el navegador descargaba la interfaz desde `web` (`http://localhost:3000`) y llamaba directamente a la API en `http://localhost:8080`. Al ser dos orígenes distintos, eso obligaba a:

- habilitar CORS en la API (`CORS_ORIGIN`);
- configurar en el frontend la URL de la API (`API_BASE_URL`, como argumento de build y como variable);
- abrir siempre la aplicación por `localhost` y no por `127.0.0.1`, porque si no el origen no coincidía.

La actividad evalúa la contenerización, no la configuración de orígenes. Se busca la opción más simple.

## Decisión

- El servidor web (nginx) del contenedor `web` sirve la interfaz y **reenvía `/api/` a `http://api:8080`**, usando el nombre del servicio en la red de Compose.
- El frontend llama con rutas relativas (`/api/v1/...`). El navegador solo habla con `web`, desde un único origen.
- No hay CORS, ni `CORS_ORIGIN`, ni `API_BASE_URL`.
- El puerto 8080 de `api` se sigue publicando, pero solo para probar el backend por separado (`curl http://localhost:8080/health`).
- En la configuración de nginx se usa `resolver 127.0.0.11` (el DNS interno de Docker) con la URL de la API en una variable. Así nginx vuelve a resolver el nombre y no se queda con una IP vieja si se recrea `api`.
- Si la API está caída, nginx responde `502` o `504`. El frontend trata esas respuestas como `SERVICIO_NO_DISPONIBLE` ([errores.md](../errores.md)).

## Alternativas consideradas

- **Llamada directa desde el navegador, con CORS.** Era la versión anterior. Funciona, pero requiere dos orígenes, CORS en la API, una URL configurable en el frontend y cuidar desde qué dirección se abre la aplicación.
- **Que la API sirva también la interfaz.** Evita el reenvío, pero se pierde el contenedor del servidor web que pide la actividad y se mezclan dos responsabilidades en un mismo componente ([ADR-0001](0001-docker-y-compose.md)).

## Consecuencias

- Hay un solo origen y menos configuración: desaparecen CORS y la URL de la API en el frontend.
- En el video se puede mostrar la comunicación entre contenedores por nombre de servicio (`web` → `api`).
- `web` depende de `api` para resolver el nombre `api` dentro de la red de Compose.
- Los errores de nginx (`502`, `504`) no traen el JSON de error del contrato. El frontend los interpreta por su código HTTP.
