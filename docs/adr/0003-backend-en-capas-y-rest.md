# ADR-0003: Backend en capas con API REST y contrato primero

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

Backend y frontend los desarrollan personas distintas, posiblemente con herramientas distintas. Hace falta un acuerdo claro de cómo se comunican y de dónde vive cada responsabilidad, para que las partes encajen sin coordinación constante.

## Decisión

- **API REST con JSON.** El contrato está escrito en OpenAPI ([`docs/api/openapi.yaml`](../api/openapi.yaml)) y se define **antes** de implementar.
- **Arquitectura en capas:** Controller, Service y Repository, con dependencias en un solo sentido.
- Las reglas de negocio viven en la capa de servicio. La base de datos mantiene sus restricciones como última línea de defensa, pero no es la única validación.

La tabla de responsabilidades por capa está en [arquitectura.md](../arquitectura.md#4-capas-del-backend).

## Alternativas consideradas

- **Lógica de negocio en el frontend.** Duplica reglas y deja la API sin protección.
- **Controladores que ejecutan SQL directamente.** Más corto de escribir, pero mezcla HTTP, negocio y datos, y dificulta probar cada parte.
- **GraphQL.** Más flexible, pero agrega complejidad que este alcance no justifica.

## Consecuencias

- Frontend y backend pueden avanzar en paralelo, cada uno contra el contrato.
- Las reglas de negocio se implementan en el servicio y se prueban allí, aunque la base de datos también tenga su `CHECK`.
- Hay más archivos que en un diseño plano. Es el costo de que la arquitectura sea visible.
