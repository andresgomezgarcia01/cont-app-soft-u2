# Atajos para el trabajo diario. Cada objetivo imprime el comando Docker real
# que ejecuta, así que sirve también como referencia (ver docs/comandos.md).
# Uso: make <objetivo>        Lista de objetivos: make help

# Lee .env si existe, para que los atajos usen los mismos puertos que Compose.
-include .env

.DEFAULT_GOAL := help
.PHONY: help up up-db seed build down reset ps logs db-shell health

help: ## Muestra esta ayuda
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

up: ## Construye y levanta db, api y web (sin datos base)
	docker compose up -d --build

up-db: ## Levanta solo la base de datos (sin datos base)
	docker compose up -d --build db

seed: ## Carga los datos base a propósito (se puede repetir)
	docker compose run --rm seed

build: ## Construye las imágenes sin levantar nada
	docker compose build

down: ## Apaga los contenedores y conserva los datos
	docker compose down

reset: ## Apaga y BORRA los datos (al subir, el esquema se recrea vacío)
	docker compose down -v

ps: ## Estado de los servicios
	docker compose ps

logs: ## Sigue los logs de todos los servicios
	docker compose logs -f

db-shell: ## Abre psql dentro del contenedor de la base de datos
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

health: ## Consulta el estado de la API
	curl -s http://localhost:$(or $(API_PORT),8080)/health
