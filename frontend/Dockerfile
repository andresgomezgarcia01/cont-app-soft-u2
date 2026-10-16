# Imagen del frontend: nginx sirve la interfaz en el puerto 80 y reenvía /api/
# a la API (ver nginx.conf y ADR-0011).
#
# El framework todavía no está decidido (ADR-0010). Cuando se decida:
#   - Con framework (React + Vite, Angular...): descomentar la etapa "build" y
#     la línea COPY --from=build, ajustando la carpeta de salida.
#   - Sin framework (HTML, CSS y JS): poner los archivos en frontend/public/ y
#     descomentar la línea COPY public/.
# Mientras tanto la imagen construye igual y sirve la página por defecto de
# nginx, con el reenvío de /api/ ya activo.

# --- Etapa 1: build (solo con framework) ------------------------------------
# FROM node:24-alpine AS build
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# --- Etapa final: servidor web ------------------------------------------------
FROM nginx:1.30-alpine

LABEL org.opencontainers.image.title="catalogo-web" \
      org.opencontainers.image.description="Interfaz web del catálogo de aplicaciones"

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Con framework. Carpeta de salida: Vite deja dist/; Angular, dist/<proyecto>/browser/.
# COPY --from=build /app/dist /usr/share/nginx/html

# Sin framework.
# COPY public/ /usr/share/nginx/html/

EXPOSE 80
# CMD y la señal de parada (SIGQUIT, cierre ordenado) vienen de la imagen de nginx.
