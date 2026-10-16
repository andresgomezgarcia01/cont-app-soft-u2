# Decisiones de arquitectura (ADR)

Un ADR (*Architecture Decision Record*) deja por escrito **qué se decidió, por qué y qué se descartó**. Así, quien llegue al proyecto entiende las razones y no solo el resultado.

## Estados

- **Propuesto:** redactado, pendiente de acuerdo con el grupo.
- **Aceptado:** el grupo lo acordó.
- **Pendiente:** hay que decidirlo; el documento lista las opciones y los criterios.
- **Reemplazado:** otro ADR lo sustituyó (se enlaza).

## Índice

| ADR | Título | Estado |
|---|---|---|
| [0001](0001-docker-y-compose.md) | Un contenedor por componente, orquestados con Docker Compose | Propuesto |
| [0002](0002-postgresql-con-scripts-sql.md) | PostgreSQL con esquema en scripts SQL, sin ORM | Propuesto |
| [0003](0003-backend-en-capas-y-rest.md) | Backend en capas con API REST y contrato primero | Propuesto |
| [0004](0004-modelo-de-datos-del-catalogo.md) | Modelo de datos: aplicación y despliegue (1 a N) | Propuesto |
| [0005](0005-contrato-de-errores.md) | Formato único de errores y mapeo a códigos HTTP | Propuesto |
| [0006](0006-carga-masiva-json.md) | Carga masiva con JSON, todo o nada y tope configurable | Propuesto |
| [0007](0007-arranque-ordenado-y-seed.md) | Arranque ordenado con healthcheck y seed a pedido | Propuesto |
| [0008](0008-persistencia-con-volumen.md) | Persistencia con volumen nombrado | Propuesto |
| [0009](0009-stack-del-backend.md) | Lenguaje y framework del backend | Pendiente |
| [0010](0010-stack-del-frontend.md) | Framework del frontend | Pendiente |
| [0011](0011-interfaz-reenvia-llamadas-a-la-api.md) | La interfaz reenvía las llamadas a la API | Propuesto |

## Cómo agregar uno

Copiar cualquier ADR existente, numerarlo con el siguiente número libre y mantenerlo corto: contexto, decisión, alternativas y consecuencias. Un ADR no se borra: si la decisión cambia, se crea uno nuevo que lo reemplaza.
