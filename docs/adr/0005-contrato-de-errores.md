# ADR-0005: Formato único de errores y mapeo a códigos HTTP

- **Estado:** Propuesto
- **Fecha:** 2026-10-16

## Contexto

Si cada endpoint o cada integrante inventa sus propios errores, el frontend no puede tratarlos de forma uniforme. Hay que fijar un formato y una tabla de códigos antes de implementar.

## Decisión

Todos los errores usan la misma forma de JSON y un conjunto pequeño de códigos HTTP:

```json
{
  "codigo": "REGLA_NEGOCIO",
  "mensaje": "Si la modalidad es NUBE, proveedor_nube es obligatorio",
  "detalles": [{ "campo": "proveedor_nube", "motivo": "obligatorio cuando modalidad es NUBE" }]
}
```

| HTTP | `codigo` |
|---|---|
| 400 | `PETICION_INVALIDA` |
| 404 | `NO_ENCONTRADO` |
| 409 | `CONFLICTO` |
| 413 | `LOTE_EXCEDE_LIMITE` |
| 422 | `REGLA_NEGOCIO` |
| 500 | `ERROR_INTERNO` |
| 503 | `SERVICIO_NO_DISPONIBLE` |

Convenciones:

- **400 frente a 422:** 400 cuando la petición está mal formada; 422 cuando está bien formada pero incumple una regla de negocio.
- `mensaje` es legible y apto para mostrarse al usuario.
- Un `500` **nunca** expone trazas ni mensajes de la base de datos: el detalle va al log.

El detalle completo (por endpoint, reglas y traducción de errores de la base de datos) está en [errores.md](../errores.md).

## Alternativas consideradas

- **Usar solo 400 para todo error del cliente.** Más simple, pero pierde la diferencia entre "mal formado" y "regla de negocio".
- **Problem Details (RFC 9457).** Es el estándar para errores de APIs HTTP y sería una buena evolución. Se descarta por ahora para mantener el formato más corto y fácil de explicar.

## Consecuencias

- El frontend puede mostrar `mensaje` y resaltar los campos listados en `detalles` sin conocer cada endpoint.
- Hay que mantener sincronizados `errores.md` y el esquema `Error` del OpenAPI.
