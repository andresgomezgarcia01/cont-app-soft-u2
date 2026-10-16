# Errores de la API

Contrato de errores que **toda la API debe cumplir**, sin excepciones. El backend lo implementa y el frontend lo consume. Complementa a [`openapi.yaml`](api/openapi.yaml) y se apoya en el [ADR-0005](adr/0005-contrato-de-errores.md).

## 1. Respuestas exitosas

| Operación | HTTP | Cuerpo |
|---|---|---|
| `GET` (consulta o listado) | 200 | El recurso o un arreglo (vacío si no hay resultados) |
| `POST` (creación) | 201 | El recurso creado, o el resumen del lote |

Una lista vacía **no es un error**: es un `200` con `[]`.

`fecha_registro` es de solo lectura: la asigna el servidor al crear.

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
| 404 | `NO_ENCONTRADO` | El id no existe, o la aplicación padre no existe al crear un despliegue |
| 409 | `CONFLICTO` | Ya existe una aplicación con ese nombre, o la aplicación ya tiene un despliegue en ese ambiente |
| 413 | `LOTE_EXCEDE_LIMITE` | El lote trae más elementos que `MAX_BATCH_SIZE` |
| 422 | `REGLA_NEGOCIO` | Petición bien formada que incumple una regla de negocio (sección 5) |
| 500 | `ERROR_INTERNO` | Falla inesperada. El detalle va al log, **nunca** a la respuesta |
| 503 | `SERVICIO_NO_DISPONIBLE` | La API está en ejecución pero no logra conectar con la base de datos |

**400 frente a 422.** Se usa 400 cuando la petición está mal formada y 422 cuando está bien formada pero rompe una regla. Es una convención del proyecto: otros equipos usan solo 400.

**`502` y `504` de nginx.** La interfaz llama a la API a través de `web` ([ADR-0011](adr/0011-interfaz-reenvia-llamadas-a-la-api.md)). Si la API está caída, responde nginx con `502` o `504`, sin este formato. El frontend los trata como `SERVICIO_NO_DISPONIBLE`.

## 4. Qué errores puede devolver cada endpoint

Todos pueden devolver además `500`. Los que consultan la base de datos pueden devolver `503`.

| Endpoint | 400 | 404 | 409 | 413 | 422 |
|---|:-:|:-:|:-:|:-:|:-:|
| `GET /aplicaciones` | x | | | | |
| `POST /aplicaciones` | x | | x | | |
| `POST /aplicaciones/lote` | x | | x | x | x |
| `GET /aplicaciones/{id}` | x | x | | | |
| `GET /aplicaciones/{id}/despliegues` | x | x | | | |
| `POST /aplicaciones/{id}/despliegues` | x | x | x | | x |
| `GET /health` | | | | | |

`GET /health` devuelve `200` si la base de datos responde y `503` si no.

El `409` aparece en dos casos, ambos con `codigo` `CONFLICTO`:

- **Nombre repetido** (`campo: nombre`): en `POST /aplicaciones` y en la carga masiva.
- **Ambiente repetido** (`campo: ambiente`): la aplicación ya tiene un despliegue en ese ambiente. Ocurre en `POST /aplicaciones/{id}/despliegues` y en la carga masiva, incluido el caso de dos despliegues del mismo ambiente dentro de una misma aplicación del lote.

## 5. Reglas de negocio (`422`)

| Regla | Descripción | Dónde se verifica |
|---|---|---|
| R1 | Si `modalidad` es `NUBE`, `proveedor_nube` es obligatorio | Service y `CHECK` en la base de datos |
| R2 | Si `modalidad` es `ON_PREMISE` o `SAAS`, `proveedor_nube` debe omitirse o ser `null` | Service y `CHECK` en la base de datos |

Se aplican al crear un despliegue y a cada despliegue anidado de la carga masiva.

## 6. Orden de las validaciones

Si una petición incumple varias cosas, se devuelve el primer error en este orden:

1. **Formato** (`400`)
2. **Existencia** (`404`)
3. **Reglas de negocio** (`422`)
4. **Conflictos** (`409`), que se detectan al guardar

La carga masiva valida **elemento por elemento, en orden**. Cada elemento pasa por el orden de arriba (formato, reglas y, al guardar, conflictos). **El primer error corta:** se hace `ROLLBACK`, no se guarda nada y se reporta el `indice` de ese elemento. Los elementos que siguen no se evalúan.

- Un nombre repetido dentro del mismo lote se reporta en el `indice` de la **segunda** aparición: la primera ya se guardó cuando llega la segunda.
- Dos despliegues del mismo ambiente dentro de una misma aplicación del lote dan `409` con `campo: ambiente`, en el `indice` de esa aplicación.

## 7. Traducción de errores de la base de datos

El Service no debe dejar escapar errores de la base de datos. Traducción recomendada, usando el código `SQLSTATE` de PostgreSQL:

| `SQLSTATE` | Significado | Se traduce a |
|---|---|---|
| `23505` | `unique_violation` | 409 `CONFLICTO`. Según la restricción que falló: `uq_aplicacion_nombre` → `campo: nombre`; `uq_despliegue_aplicacion_ambiente` → `campo: ambiente` |
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

**409: ambiente repetido**

```http
POST /api/v1/aplicaciones/7/despliegues
```
```json
{
  "codigo": "CONFLICTO",
  "mensaje": "La aplicación ya tiene un despliegue en PROD",
  "detalles": [{ "campo": "ambiente", "motivo": "duplicado" }]
}
```

**422 en carga masiva: falla el elemento 3 (el cuarto del arreglo)**

```json
{
  "codigo": "REGLA_NEGOCIO",
  "mensaje": "Si la modalidad es NUBE, proveedor_nube es obligatorio",
  "detalles": [{ "indice": 3, "campo": "despliegues[0].proveedor_nube", "motivo": "obligatorio cuando modalidad es NUBE" }]
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
