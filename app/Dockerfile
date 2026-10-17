# Imagen de la aplicación del catálogo: el servidor web (Node.js + Express).
# Se construye en dos etapas para que la imagen final sea liviana.

# --- Etapa 1: instalar las dependencias de producción -------------------------
FROM node:24-alpine AS deps
WORKDIR /app
# Primero solo los archivos de dependencias: si no cambian, Docker reutiliza
# esta capa y no vuelve a instalar todo en cada build.
# El asterisco hace que package-lock.json sea opcional.
COPY package.json package-lock.json* ./
# Con package-lock.json se usa npm ci (versiones exactas, build reproducible).
# Mientras no exista, se usa npm install. Conviene generar el package-lock.json
# (npm install en app/) y commitearlo en cuanto se pueda.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# --- Etapa final: la imagen que se ejecuta --------------------------------------
FROM node:24-alpine
LABEL org.opencontainers.image.title="catalogo-app"
ENV NODE_ENV=production
WORKDIR /app
# Trae solo las dependencias ya instaladas de la etapa 1, y luego el código.
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No corre como root: la imagen oficial trae el usuario sin privilegios "node".
USER node
# Documenta el puerto en que escucha la aplicación dentro del contenedor.
EXPOSE 3000
# Forma exec (lista): node recibe directamente la señal de apagado (docker stop).
CMD ["node", "src/index.js"]
