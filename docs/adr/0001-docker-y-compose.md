# ADR-0001: Un contenedor por componente, orquestados con Docker Compose

- **Estado:** Propuesto
- **Fecha:** 2026-10-17

## Contexto

La actividad exige desplegar una aplicación con Docker, con una base de datos relacional y un servidor web, todo dentro de contenedores. Son varios componentes (la base de datos, un job que carga datos de ejemplo y la aplicación) que deben arrancar juntos, en orden y de forma repetible en la máquina de cada integrante.

Las lecturas de la unidad plantean además la filosofía de **un proceso principal por contenedor**, que facilita el despliegue, el mantenimiento y la escalabilidad independiente de cada componente.

## Decisión

- Un contenedor por componente: `db`, `seed` y `app`.
- Se orquestan con **Docker Compose**, con un único `docker-compose.yml` en la raíz del repositorio.
- Imágenes propias para la base de datos (lo pide el enunciado) y para la aplicación. `seed` usa la imagen oficial `postgres:17-alpine`, que ya trae el cliente `psql`.
- Una **red con nombre explícito**, `catalogo-red`, a la que se conectan los tres servicios. Dentro de ella cada servicio se encuentra por su nombre: `app` se conecta a `db`.
- **Puertos:** `app` publica el 3000, el único puerto de servicio. `db` publica el 5432 **solo en `127.0.0.1`**, para que la aplicación pueda desarrollarse en la máquina, sin contenedor, contra la base del Compose.

## Alternativas consideradas

- **`docker run` a mano por cada componente.** Funciona, pero exige recordar puertos, redes, volúmenes y orden de arranque. Se conserva como forma alternativa para mostrar los comandos en el video ([comandos.md](../comandos.md)).
- **Kubernetes.** Excede el alcance de esta actividad; la orquestación en la nube se trabaja en la Unidad 3 del módulo.
- **Un solo contenedor con todo.** La aplicación es un monolito ([ADR-0003](0003-aplicacion-monolitica-en-capas.md)), pero eso se refiere a su código: la base de datos sigue en su propio contenedor. Meterla en el mismo contradice la filosofía de un proceso por contenedor e impide actualizar o reiniciar cada pieza por separado.
- **La red por defecto de Compose.** Funciona igual, pero queda con un nombre generado (`catalogo-apps_default`). Con el nombre explícito se reconoce en `docker network ls`.
- **No publicar el puerto de `db`.** Es más cerrado, pero obliga a desarrollar la aplicación siempre dentro de un contenedor.

## Consecuencias

- Todo el entorno se levanta con `docker compose up -d --build`, lo que hace verificable la reproducibilidad.
- El 5432 publicado puede chocar con un PostgreSQL instalado en la máquina. Se cambia con `DB_PORT` en `.env`. Al estar ligado a `127.0.0.1`, la base no se alcanza desde otras máquinas de la red.
- Compose es una herramienta de desarrollo y pruebas, no de producción. Es suficiente para este alcance.
