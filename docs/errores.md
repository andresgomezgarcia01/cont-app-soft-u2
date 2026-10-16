# Errores de la API

Contrato de errores que **toda la API debe cumplir**, sin excepciones. El backend lo implementa y el frontend lo consume. Complementa a [`openapi.yaml`](api/openapi.yaml) y se apoya en el [ADR-0005](adr/0005-contrato-de-errores.md).

## 1. Respuestas exitosas

| Operación | HTTP | Cuerpo |
|---|---|---|
| `GET` (consulta o listado) | 200 | El recurso o un arreglo (vacío si no hay resultados) |
| `PUT` (actualización) | 200 | El recurso actualizado |
| `POST` (creación) | 201 | El recurso creado, o el resumen del lote |
| `DELETE` | 204 | Sin cuerpo |

Una lista vacía **no es un error**: es un `200` con `[]`.

## 2. Formato de error

```json
{
  "codigo": "REGLA_NEGOCIO",
  "mensaje": "Si la modalidad es NUBE, proveedor_nube es obligatorio",
  "detalles": [
    { "campo": "proveedor_nube", "motivo": "obligatorio cuando modalidad es NUBE" }
  ]
}
```

| Campo | Obligatorio | Descripción |
|---|---|---|
| `codigo` | Sí | Identificador estable en mayúsculas. El frontend decide con él, no con el texto |
| `mensaje` | Sí | Texto legible, apto para mostrarse al usuario |
| `detalles` | No | Arreglo (puede ir vacío). Cada elemento puede traer `campo`, `indice` y `motivo` |

`indice` solo aplica a la carga masiva: es la posición (desde 0) del elemento del arreglo que falló. `campo` puede incluir una ruta, por ejemplo `despliegues[0].modalidad`.

## 3. Códigos de error

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `PETICION_INVALIDA` | JSON malformado, campo obligatorio ausente, tipo o valor fuera del catálogo, id no numérico, parámetro de consulta inválido, lote vacío |
| 404 | `NO_ENCONTRADO` | El id no existe (consulta, actualización o eliminación), o la aplicación padre no existe al crear un despliegue |
| 409 | `CONFLICTO` | Ya existe una aplicación con ese nombre |
| 413 | `LOTE_EXCEDE_LIMITE` | El lote trae más elementos que `MAX_BATCH_SIZE` |
| 422 | `REGLA_NEGOCIO` | Petición bien formada que incumple una regla de negocio (sección 5) |
| 500 | `ERROR_INTERNO` | Falla inesperada. El detalle va al log, **nunca** a la respuesta |
| 503 | `SERVICIO_NO_DISPONIBLE` | La API está en ejecución pero no logra conectar con la base de datos |

**400 frente a 422.** Se usa 400 cuando la petición está mal formada y 422 cuando está bien formada pero rompe una regla. Es una convención del proyecto: otros equipos usan solo 400.

## 4. Qué errores puede devolver cada endpoint

Todos pueden devolver además `500`. Los que consultan la base de datos pueden devolver `503`.

| Endpoint | 400 | 404 | 409 | 413 | 422 |
|---|:-:|:-:|:-:|:-:|:-:|
| `GET /aplicaciones` | x | | | | |
| `POST /aplicaciones` | x | | x | | |
| `POST /aplicaciones/lote` | x | | x | x | x |
| `GET /aplicaciones/{id}` | x | x | | | |
| `PUT /aplicaciones/{id}` | x | x | x | | x |
| `DELETE /aplicaciones/{id}` | x | x | | | |
| `GET /aplicaciones/{id}/despliegues` | x | x | | | |
| `POST /aplicaciones/{id}/despliegues` | x | x | | | x |
| `PUT /despliegues/{id}` | x | x | | | x |
| `DELETE /despliegues/{id}` | x | x | | | |
| `GET /health` | | | | | |

`GET /health` devuelve `200` si la base de datos responde y `503` si no.

## 5. Reglas de negocio (`422`)

| Regla | Descripción | Dónde se verifica |
|---|---|---|
| R1 | Si `modalidad` es `NUBE`, `proveedor_nube` es obligatorio | Service y `CHECK` en la base de datos |
| R2 | Si `modalidad` es `ON_PREMISE` o `SAAS`, `proveedor_nube` debe omitirse o ser `null` | Service y `CHECK` en la base de datos |
| R3 | Un despliegue `SAAS` solo puede pertenecer a una aplicación de origen `PROVEEDOR` | Service (cruza dos tablas) |

La regla R3 se evalúa en tres situaciones, que es fácil olvidar:

1. Al crear o editar un despliegue `SAAS`.
2. Al editar una aplicación y **cambiar su origen a `PROPIA`** si ya tiene despliegues `SAAS`.
3. Dentro de la carga masiva, para cada aplicación y sus despliegues anidados.

## 6. Orden de las validaciones

Si una petición incumple varias cosas, se devuelve el primer error en este orden:

1. **Formato** (`400`)
2. **Existencia** (`404`)
3. **Reglas de negocio** (`422`)
4. **Conflictos** (`409`), que se detectan al guardar

En la carga masiva se recorre el arreglo en orden y se reporta el **primer elemento** con problema, con su `indice`. Dos aplicaciones con el mismo nombre dentro del mismo lote cuentan como conflicto (`409`) en el `indice` de la segunda.

## 7. Traducción de errores de la base de datos

El Service no debe dejar escapar errores de la base de datos. Traducción recomendada, usando el código `SQLSTATE` de PostgreSQL:

| `SQLSTATE` | Significado | Se traduce a |
|---|---|---|
| `23505` | `unique_violation` | 409 `CONFLICTO` |
| `23503` | `foreign_key_violation` | 404 `NO_ENCONTRADO` (la aplicación padre no existe) |
| `23514` | `check_violation` | 422 `REGLA_NEGOCIO` (normalmente se detecta antes, en el Service) |
| `23502` | `not_null_violation` | 400 `PETICION_INVALIDA` (normalmente se detecta antes) |
| clase `08` y errores de conexión (rechazada, tiempo agotado) | Sin conexión | 503 `SERVICIO_NO_DISPONIBLE` |
| cualquier otro | Inesperado | 500 `ERROR_INTERNO` |

## 8. Ejemplos

**404: la aplicación no existe**

```http
GET /api/v1/aplicaciones/42
```
```json
{ "codigo": "NO_ENCONTRADO", "mensaje": "No existe una aplicación con id 42", "detalles": [] }
```

**409: nombre duplicado**

```json
{
  "codigo": "CONFLICTO",
  "mensaje": "Ya existe una aplicación llamada CRM Comercial",
  "detalles": [{ "campo": "nombre", "motivo": "duplicado" }]
}
```

**422 en carga masiva: falla el elemento 3 (el cuarto del arreglo)**

```json
{
  "codigo": "REGLA_NEGOCIO",
  "mensaje": "Una aplicación PROPIA no puede tener un despliegue SAAS",
  "detalles": [{ "indice": 3, "campo": "despliegues[0].modalidad", "motivo": "SAAS requiere origen PROVEEDOR" }]
}
```

**413: lote demasiado grande**

```json
{
  "codigo": "LOTE_EXCEDE_LIMITE",
  "mensaje": "El lote trae 150 aplicaciones y el máximo permitido es 100",
  "detalles": []
}
```

## 9. Reglas para quien implementa

- Ningún endpoint devuelve HTML, texto plano ni el error por defecto del framework. Hay que registrar un manejador global de errores que use este formato, incluso para rutas inexistentes (`404` con `NO_ENCONTRADO`).
- Nunca se expone una traza de pila, una consulta SQL ni el mensaje original de la base de datos. Se registran en el log del contenedor (salida estándar), donde `docker logs` las muestra.
- El texto de `mensaje` puede cambiar; el `codigo` no.
