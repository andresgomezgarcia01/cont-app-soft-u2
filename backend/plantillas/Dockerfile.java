# Plantilla: backend en Java 21 con Spring Boot y Maven.
# Uso: cp backend/plantillas/Dockerfile.java backend/Dockerfile
#
# Supone pom.xml y src/ en backend/, empaquetado como un único jar ejecutable.
# Spring no lee PORT por sí solo: en application.properties poner
#   server.port=${PORT:8080}
# y leer DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD de la misma forma.

# --- Etapa 1: compilar y empaquetar -------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Primero solo el pom: la descarga de dependencias queda en caché mientras no cambie.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# --- Etapa final: solo el JRE y el jar ----------------------------------------
FROM eclipse-temurin:21-jre-alpine
LABEL org.opencontainers.image.title="catalogo-api"
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8080
# Forma exec: la JVM recibe SIGTERM directamente (docker stop).
ENTRYPOINT ["java", "-jar", "app.jar"]
