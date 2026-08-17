.PHONY: install dev dev-backend docker-build docker-up docker-down docker-down-all docker-restart docker-clean mock-admin

GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
NC = \033[0m

DOCKER_COMPOSE ?= $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
SERVER_IP ?= $(shell ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')


install:
	@echo "$(GREEN)Instalando dependencias...$(NC)"
	npm install
	npm install react react-dom
	npm install -D @types/react @types/react-dom
	@echo "$(GREEN)✓ Dependencias instaladas$(NC)"


dev:
	@echo "$(GREEN)Iniciando frontend...$(NC)"
	npm run dev:frontend


dev-backend:
	@echo "$(GREEN)Iniciando backend...$(NC)"
	npm run dev:backend


docker-build:
	@echo "$(BLUE)Construyendo imágenes Docker...$(NC)"
	@if [ -z "$(SERVER_IP)" ]; then \
		echo "$(YELLOW)No se pudo detectar SERVER_IP automáticamente. Define SERVER_IP manualmente.$(NC)"; \
		exit 1; \
	fi
	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.yml \
		-f docker-compose.db.yml \
		build --no-cache
	@echo "$(GREEN)✓ Imágenes Docker construidas$(NC)"


docker-up:
	@if [ -z "$(SERVER_IP)" ]; then \
		echo "$(YELLOW)No se pudo detectar SERVER_IP automáticamente. Define SERVER_IP manualmente.$(NC)"; \
		exit 1; \
	fi

	@echo "$(BLUE)Levantando PostgreSQL, frontend y backend...$(NC)"
	@echo "$(BLUE)SERVER_IP: $(SERVER_IP)$(NC)"
	@echo "$(BLUE)Frontend: http://$(SERVER_IP):3000$(NC)"
	@echo "$(BLUE)Backend: http://$(SERVER_IP):4000$(NC)"

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.yml \
		-f docker-compose.db.yml \
		up -d --remove-orphans

	@echo "$(BLUE)Esperando a PostgreSQL...$(NC)"
	@until docker exec transcendence-postgres pg_isready -U postgres >/dev/null 2>&1; do \
		sleep 1; \
	done

	@echo "$(BLUE)PostgreSQL está listo$(NC)"
	@echo "$(BLUE)Inicializando base de datos...$(NC)"

	@docker exec -i transcendence-postgres \
		psql -q -v ON_ERROR_STOP=1 \
		--set=client_min_messages=warning \
		-U postgres \
		-d transcendence \
		< backend/init.sql

	@echo "$(GREEN)✓ Proyecto levantado correctamente$(NC)"


mock-admin:
	@echo "$(BLUE)Esperando a PostgreSQL...$(NC)"
	@until docker exec transcendence-postgres pg_isready -U postgres >/dev/null 2>&1; do \
		sleep 1; \
	done

	@echo "$(BLUE)Insertando usuario administrador...$(NC)"

	@docker exec -i transcendence-postgres \
		psql -v ON_ERROR_STOP=1 \
		-U postgres \
		-d transcendence \
		< backend/mock-user.sql

	@echo "$(GREEN)✓ Usuario admin creado o actualizado$(NC)"


docker-down:
	@echo "$(YELLOW)Deteniendo frontend y backend (PostgreSQL sigue corriendo)...$(NC)"
	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.yml \
		down --remove-orphans


docker-down-all:
	@echo "$(YELLOW)Deteniendo todos los servicios...$(NC)"

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.yml \
		down --remove-orphans

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.db.yml \
		down --remove-orphans


docker-restart:
	@echo "$(BLUE)Reiniciando frontend y backend...$(NC)"
	@if [ -z "$(SERVER_IP)" ]; then \
		echo "$(YELLOW)No se pudo detectar SERVER_IP automáticamente. Define SERVER_IP manualmente.$(NC)"; \
		exit 1; \
	fi

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.yml \
		-f docker-compose.db.yml \
		restart frontend backend

	@echo "$(GREEN)✓ Frontend y backend reiniciados$(NC)"


docker-clean:
	@echo "$(YELLOW)⚠ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos$(NC)"
	@echo "$(YELLOW)Deteniendo servicios y eliminando volúmenes...$(NC)"

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.yml \
		down -v --remove-orphans

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		-f docker-compose.db.yml \
		down -v --remove-orphans

	@echo "$(GREEN)✓ Contenedores y volúmenes eliminados$(NC)"