# ADR-0001: Un contenedor por componente, orquestados con Docker Compose

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

La actividad exige desplegar una aplicación con Docker, con una base de datos relacional y un servidor web, todo dentro de contenedores. Son varios componentes (base de datos, job de carga, API y frontend) que deben arrancar juntos, en orden y de forma repetible en la máquina de cada integrante.

Las lecturas de la unidad plantean además la filosofía de **un proceso principal por contenedor**, que facilita el despliegue, el mantenimiento y la escalabilidad independiente de cada componente.

## Decisión

- Un contenedor por componente: `db`, `seed`, `api` y `web`.
- Se orquestan con **Docker Compose**, con un único `docker-compose.yml` en la raíz del repositorio.
- Imágenes propias para la base de datos (lo pide el enunciado), la API y el frontend.

## Alternativas consideradas

- **`docker run` a mano por cada componente.** Funciona, pero exige recordar puertos, redes, volúmenes y orden de arranque. Se conserva como forma alternativa para mostrar los comandos en el video ([comandos.md](../comandos.md)).
- **Kubernetes.** Excede el alcance de esta actividad; la orquestación en la nube se trabaja en la Unidad 3 del módulo.
- **Un solo contenedor con todo.** Contradice la filosofía de un proceso por contenedor y impide escalar o actualizar cada pieza por separado.

## Consecuencias

- Todo el entorno se levanta con `docker compose up -d --build`, lo que hace verificable la reproducibilidad.
- Compose es una herramienta de desarrollo y pruebas, no de producción. Es suficiente para este alcance.
