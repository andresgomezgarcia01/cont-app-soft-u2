# ADR-0009: Lenguaje y framework del backend

- **Estado:** Pendiente (se decide en la reunión del grupo)
- **Fecha:** 2026-10-16

## Contexto

El contrato de la API ([`openapi.yaml`](../api/openapi.yaml)), el modelo de datos y los errores ya están definidos, y son independientes del lenguaje. Falta elegir con qué se implementa el backend. La decisión debe tomarla quien lo vaya a desarrollar, con estos criterios.

## Criterios sugeridos

- **Dominio del equipo:** gana lo que la persona responsable ya maneje, porque el tiempo es corto.
- **Imagen liviana:** que se pueda construir una imagen pequeña (por ejemplo, con *multi-stage build*), que es también una ventaja de la contenerización.
- **Conexión a PostgreSQL:** driver o biblioteca madura, con *pool* de conexiones y transacciones (necesarias para la carga masiva).
- **Validación y OpenAPI:** facilidad para validar la entrada y, si es posible, contrastar con el contrato.
- **Capas:** que permita separar Controller, Service y Repository con claridad ([ADR-0003](0003-backend-en-capas-y-rest.md)).

## Decisión

| Aspecto | Elección |
|---|---|
| Lenguaje | por definir |
| Framework | por definir |
| Acceso a datos | por definir |
| Responsable | por definir |

## Requisitos que aplican con cualquier opción

Están en [`backend/README.md`](../../backend/README.md): puerto 8080, escuchar en `0.0.0.0`, variables de entorno, formato de errores, `/health` y manejo de `SIGTERM`.

## Consecuencias

Cuando se decida, actualizar la tabla, cambiar el estado a **Aceptado** y registrar aquí las alternativas descartadas.
