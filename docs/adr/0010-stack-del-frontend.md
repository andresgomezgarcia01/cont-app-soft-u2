# ADR-0010: Framework del frontend

- **Estado:** Pendiente (se decide en la reunión del grupo)
- **Fecha:** 2026-10-16

## Contexto

La interfaz consume la API definida en [`openapi.yaml`](../api/openapi.yaml). Las pantallas y su comportamiento están descritos en [`frontend/README.md`](../../frontend/README.md); falta elegir con qué se construyen. La rúbrica valora una interfaz gráfica con "diseño agradable" y buenos estándares de UX/UI, así que la decisión debe tomarla quien la vaya a desarrollar.

## Criterios sugeridos

- **Dominio del equipo:** igual que en el backend, gana lo que ya se maneje.
- **Imagen liviana:** que el resultado sea archivos estáticos servibles desde un contenedor pequeño en el puerto 80.
- **Servible por nginx:** que el resultado sean archivos estáticos que nginx pueda servir, con llamadas relativas a `/api/` ([ADR-0011](0011-interfaz-reenvia-llamadas-a-la-api.md)).
- **Formularios y tablas:** que haga razonablemente fácil el manejo de formularios con validación y de listas con búsqueda.

## Decisión

| Aspecto | Elección |
|---|---|
| Framework o biblioteca | por definir (puede ser HTML, CSS y JavaScript sin framework) |
| Librería de componentes o estilos | por definir |
| Responsable | por definir |

## Consecuencias

Cuando se decida, actualizar la tabla, cambiar el estado a **Aceptado** y registrar aquí las alternativas descartadas.
