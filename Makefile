.PHONY: install dev dev-backend clean docker-db docker-up docker-down docker-clean docker-logs

# Colors
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
NC = \033[0m # No Color

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

docker-db:
	@echo "$(BLUE)Levantando PostgreSQL (se mantiene corriendo)...$(NC)"
	@echo "$(BLUE)PostgreSQL: localhost:5432$(NC)"
	docker-compose -f docker-compose.db.yml up -d

docker-up: docker-db
	@echo "$(BLUE)Levantando frontend y backend...$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"
	@echo "$(BLUE)Backend: http://localhost:4000$(NC)"
	@sleep 2
	docker-compose up -d

docker-down:
	@echo "$(YELLOW)Deteniendo frontend y backend (PostgreSQL sigue corriendo)...$(NC)"
	docker-compose down

docker-down-all:
	@echo "$(YELLOW)Deteniendo TODOS los servicios (incluyendo PostgreSQL)...$(NC)"
	docker-compose down
	docker-compose -f docker-compose.db.yml down

docker-logs:
	@echo "$(BLUE)Mostrando logs de los servicios...$(NC)"
	docker-compose logs -f

docker-clean:
	@echo "$(YELLOW)⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos$(NC)"
	@echo "$(YELLOW)Deteniendo servicios y eliminando volúmenes...$(NC)"
	docker-compose down -v
	docker-compose -f docker-compose.db.yml down -v

clean:
	@echo "$(YELLOW)Limpiando node_modules y lock files...$(NC)"
	rm -rf node_modules frontend/node_modules backend/node_modules
	rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json
	@echo "$(GREEN)✓ Limpieza completada$(NC)"
