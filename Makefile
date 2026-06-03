.PHONY: install dev dev-backend clean docker-env docker-network docker-db docker-up docker-down docker-down-all docker-clean

# Colors
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
NC = \033[0m # No Color

# Prefer Docker Compose v2 when available; override like `make DOCKER_COMPOSE=docker-compose docker-up`
DOCKER_COMPOSE ?= $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

install:
	@echo "$(GREEN)Instalando dependencias del monorepo...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencias instaladas en la raíz$(NC)"

dev:
	@echo "$(GREEN)Iniciando frontend...$(NC)"
	npm run dev:frontend

dev-backend:
	@echo "$(GREEN)Iniciando backend...$(NC)"
	npm run dev:backend

docker-network:
	@docker network inspect transcendence-network >/dev/null 2>&1 || docker network create transcendence-network

docker-env:
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "$(YELLOW)Se creo backend/.env desde backend/.env.example$(NC)"; \
	fi

docker-db: docker-env docker-network
	@echo "$(BLUE)Levantando PostgreSQL (se mantiene corriendo)...$(NC)"
	@echo "$(BLUE)PostgreSQL: localhost:5432$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.db.yml up -d
	@$(DOCKER_COMPOSE) -f docker-compose.db.yml ps -q postgres >/dev/null 2>&1 || (echo "$(YELLOW)PostgreSQL no se pudo iniciar$(NC)" && exit 1)

docker-up: docker-db
	@echo "$(BLUE)Esperando a PostgreSQL...$(NC)"
	@until docker exec transcendence-postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
	@echo "$(BLUE)Levantando frontend y backend...$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"
	@echo "$(BLUE)Backend: http://localhost:4000$(NC)"
	@sleep 2
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.db.yml up -d --remove-orphans
	@echo "$(BLUE)Inicializando base de datos...$(NC)"
	@sleep 3
	@docker exec transcendence-postgres psql -U postgres -d transcendence -f /docker-entrypoint-initdb.d/init.sql 2>/dev/null || true
	@echo "$(GREEN)✓ Base de datos lista$(NC)"

docker-down:
	@echo "$(YELLOW)Deteniendo frontend y backend (PostgreSQL sigue corriendo)...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.yml down

docker-down-all:
	@echo "$(YELLOW)Deteniendo TODOS los servicios (incluyendo PostgreSQL)...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) -f docker-compose.db.yml down

docker-clean:
	@echo "$(YELLOW)⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos$(NC)"
	@echo "$(YELLOW)Deteniendo servicios y eliminando volúmenes...$(NC)"
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) -f docker-compose.db.yml down -v

clean:
	@echo "$(YELLOW)Limpiando node_modules y lock files...$(NC)"
	rm -rf node_modules frontend/node_modules backend/node_modules
	rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json
	@echo "$(GREEN)✓ Limpieza completada$(NC)"
