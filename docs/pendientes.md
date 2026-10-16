# Pendientes y preguntas abiertas

Cosas que **no están claras en el enunciado** o que el grupo debe decidir. Cada una indica el supuesto con el que se avanzó mientras tanto.

## Para confirmar con el tutor

| # | Pregunta | Por qué importa | Supuesto actual |
|---|---|---|---|
| 1 | ¿"7 columnas por tabla" es exacto o un mínimo? | El enunciado dice 7 por tabla; hoy `aplicacion` tiene 7 y `despliegue` tiene 8 | Es un mínimo. Si fuera exacto, se quita `ubicacion` de `despliegue` (es opcional) |
| 2 | ¿Los "15 datos" son 15 registros en total, o 15 por tabla? ¿Y la rúbrica habla de "15 tipos de datos diferentes" o de 15 datos? | Define cuántos registros hay que mostrar | 15 registros en total entre ambas tablas, y las 15 columnas cubren el criterio de tipos. Con la carga masiva se pueden mostrar más sin esfuerzo |
| 3 | ¿La carga masiva por JSON cuenta como "ingresar datos"? | Ingresar 15 registros uno a uno en el video es poco práctico | Sí cuenta; igual el formulario individual existe y se usa para mostrar algunos |
| 4 | ¿Qué "estándares UX/UI" se esperan en el nivel excelente? | La rúbrica los pide sin definirlos | Los de la lista de [frontend/README.md](../frontend/README.md) |
| 5 | ¿Los comandos de `docker compose` cuentan dentro de los 30? | Define cuántos comandos hay que mostrar | Sí cuentan. De todas formas la lista tiene 53 |
| 6 | ¿La entrega es individual o grupal? | La actividad dice "según las instrucciones del tutor" | Grupal |
| 7 | ¿Hay duración mínima o máxima para el video? | El enunciado no la fija | Sin límite conocido |

## Para decidir en el grupo

| # | Decisión | Dónde queda registrada |
|---|---|---|
| 8 | Lenguaje y framework del **backend** | [ADR-0009](adr/0009-stack-del-backend.md) |
| 9 | Framework del **frontend** | [ADR-0010](adr/0010-stack-del-frontend.md) |
| 10 | Responsables de cada parte (base de datos y Compose, backend, frontend, documentación, video) | Tabla de estado del [README](../README.md) |
| 11 | Si se implementan editar y eliminar o solo crear y consultar. El mínimo que pide el enunciado es crear y consultar | [Contrato](api/openapi.yaml) (ya los define) |
| 12 | Fecha y hora de las reuniones de integración y de grabación | [Cronograma](rubrica-y-evidencias.md#5-propuesta-de-cronograma) |

## Por verificar técnicamente

| # | Qué falta | Estado |
|---|---|---|
| 13 | Construir y ejecutar la imagen `catalogo-db` y el `docker-compose.yml` dentro de Docker. El esquema y el seed ya se probaron contra PostgreSQL 16, y el archivo de Compose se validó con `docker compose config`, pero no se ejecutó | Pendiente |
| 14 | Confirmar que `psql -U postgres -c "\dt"` dentro del contenedor de práctica muestra las dos tablas (el esquema se carga en la base `postgres` cuando no se define `POSTGRES_DB`) | Pendiente |
| 15 | Discrepancia: la lectura de la Unidad 2 dice que `docker pause` usa `SIGSTOP`, pero la documentación de Docker dice que en Linux usa el cgroup *freezer*. En el video se explicará según la documentación de Docker | Resuelto en [comandos.md](comandos.md#notas-para-explicar-bien) |
| 16 | Los diagramas están escritos en Mermaid, que GitHub muestra directamente. Comprobar que se vean bien en el visor que se use | Pendiente |
