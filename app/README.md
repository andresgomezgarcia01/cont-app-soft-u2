# Catálogo de Aplicaciones y Despliegues

Aplicación web desarrollada como parte de la Actividad Sumativa 2 de la Unidad 2. Permite administrar un catálogo de aplicaciones de software, consultar sus despliegues e importar información desde archivos CSV.

## Tecnologías utilizadas

- **Node.js** y **Express** para la lógica del servidor.
- **EJS** para renderizar las vistas del lado del servidor.
- **PostgreSQL** como sistema gestor de base de datos.
- **Docker Compose** para ejecutar la aplicación y la base de datos.
- **HTML, CSS y JavaScript** para la interfaz de usuario.

## Arquitectura

El proyecto utiliza una arquitectura monolítica organizada por capas, separando las responsabilidades para facilitar el mantenimiento y la comprensión del código.

- **Rutas:** reciben las solicitudes HTTP y coordinan las operaciones.
- **Servicios:** implementan las reglas de negocio y las validaciones.
- **Repositorios:** encapsulan las operaciones de acceso a PostgreSQL.
- **Vistas:** presentan la información mediante plantillas EJS.
- **Archivos estáticos:** contienen los estilos y recursos de la interfaz.

## Funcionalidades

- Consultar el catálogo de aplicaciones.
- Buscar aplicaciones por nombre.
- Registrar nuevas aplicaciones.
- Consultar el detalle de una aplicación y sus despliegues.
- Registrar despliegues asociados a una aplicación.
- Validar los datos ingresados y evitar duplicados según las restricciones definidas.
- Importar aplicaciones y sus despliegues desde un archivo CSV.
- Ejecutar la importación mediante una transacción para evitar cargas parciales cuando ocurre un error.
- Consultar el estado del servicio mediante el endpoint `/health`.

## Requisitos

- Docker y Docker Compose instalados.
- Git para gestionar los cambios del proyecto.

## Instalación y ejecución

Clonar el repositorio y acceder a la carpeta del proyecto:

```bash
git clone https://github.com/andresgomezgarcia01/cont-app-soft-u2.git
cd cont-app-soft-u2
```

Iniciar los servicios:

```bash
docker compose up -d --build
```

Consultar el estado de los contenedores:

```bash
docker compose ps
```

La aplicación estará disponible en:

- **Catálogo:** http://localhost:3000/aplicaciones
- **Importación CSV:** http://localhost:3000/carga
- **Crear nueva app:** http://localhost:3000/aplicaciones/nueva
- **Estado del servicio:** http://localhost:3000/health

## Importación de datos

El archivo de datos de prueba se encuentra en:

`docs/datos/aplicaciones-video.csv`

Para importar los datos, ingresar a `http://localhost:3000/carga`, seleccionar el archivo CSV y ejecutar la carga desde la interfaz.

La importación valida la información y utiliza una transacción para mantener la consistencia de los registros. Si ocurre un error, se revierte la operación para evitar que queden datos parcialmente importados.

El archivo debe conservar la estructura y los encabezados esperados por la aplicación.

## Detener los servicios

Para detener los contenedores:

```bash
docker compose down
```

Este comando detiene y elimina los contenedores de Compose, pero no elimina por sí solo los archivos del proyecto.

## Estructura general

```text
cont-app-soft-u2/
├── app/
│   └── src/
│       ├── public/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       └── views/
├── docs/
│   └── datos/
│       └── aplicaciones-video.csv
├── docker-compose.yml
└── README.md
```

La estructura anterior resume los directorios principales de la aplicación; puede variar según los archivos auxiliares presentes en el repositorio.
