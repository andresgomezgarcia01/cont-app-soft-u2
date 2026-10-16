# Atajos para el trabajo diario. Cada objetivo imprime el comando Docker real
# que ejecuta, así que sirve también como referencia (ver docs/comandos.md).
# Uso: make <objetivo>        Lista de objetivos: make help

.DEFAULT_GOAL := help
.PHONY: help up up-db build down reset ps logs db-shell health

help: ## Muestra esta ayuda
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

up: ## Construye y levanta todo (db, seed, api, web)
	docker compose up -d --build

up-db: ## Levanta solo la base de datos y carga los datos base
	docker compose up -d --build db seed

build: ## Construye las imágenes sin levantar nada
	docker compose build

down: ## Apaga los contenedores y conserva los datos
	docker compose down

reset: ## Apaga y BORRA los datos (el esquema y el seed se recargan al subir)
	docker compose down -v

ps: ## Estado de los servicios
	docker compose ps

logs: ## Sigue los logs de todos los servicios
	docker compose logs -f

db-shell: ## Abre psql dentro del contenedor de la base de datos
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

health: ## Consulta el estado de la API
	curl -s http://localhost:$${API_PORT:-8080}/health
