SHELL := /bin/bash

.PHONY: setup install dev dev-backend docker-build docker-up docker-down docker-down-all docker-restart docker-clean mock-admin

GREEN  := $(shell printf '\033[0;32m')
BLUE   := $(shell printf '\033[0;34m')
YELLOW := $(shell printf '\033[0;33m')
NC     := $(shell printf '\033[0m')
DOCKER_COMPOSE ?= $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
SERVER_IP ?= $(shell ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')

ifeq ($(strip $(SERVER_IP)),)
	SERVER_IP := localhost
endif

CALLBACK_URL = https://$(SERVER_IP):8443/api/auth/42/callback

install:
	@if [ -d node_modules ] && [ -f package-lock.json ]; then \
		echo "$(GREEN)✓ Dependencias ya instaladas (node_modules existe)$(NC)"; \
	else \
		echo "$(GREEN)Instalando dependencias...$(NC)"; \
		npm install; \
		npm install react react-dom; \
		npm install -D @types/react @types/react-dom; \
		echo "$(GREEN)✓ Dependencias instaladas$(NC)"; \
	fi

setup:
	@bash -c '\
		if [ -f backend/.env ]; then \
			echo ""; \
			echo "$(GREEN)✓ backend/.env ya existe.$(NC)"; \
			echo "$(BLUE)✓ Se omite la configuración del entorno.$(NC)"; \
			echo "$(BLUE)✓ El archivo existente NO será modificado ni sobrescrito.$(NC)"; \
			echo "$(BLUE)✓ Continuando con el proceso...$(NC)"; \
			echo ""; \
			exit 0; \
		fi; \
		\
		if [ ! -f backend/.env.example ]; then \
			echo "$(YELLOW)Error: no se encontró backend/.env.example$(NC)"; \
			exit 1; \
		fi; \
		\
		if ! command -v openssl >/dev/null 2>&1; then \
			echo "$(YELLOW)Error: openssl es necesario para generar los secretos.$(NC)"; \
			exit 1; \
		fi; \
		\
		echo ""; \
		echo "$(BLUE)==============================================$(NC)"; \
		echo "$(BLUE)      CONFIGURACIÓN DE backend/.env$(NC)"; \
		echo "$(BLUE)==============================================$(NC)"; \
		echo ""; \
		\
		read -p "Introduce FORTYTWO_CLIENT_ID: " ft_id; \
		if [ -z "$$ft_id" ]; then \
			echo "$(YELLOW)Error: FORTYTWO_CLIENT_ID no puede estar vacío.$(NC)"; \
			exit 1; \
		fi; \
		\
		read -p "Introduce FORTYTWO_CLIENT_SECRET: " ft_secret; \
		echo ""; \
		if [ -z "$$ft_secret" ]; then \
			echo "$(YELLOW)Error: FORTYTWO_CLIENT_SECRET no puede estar vacío.$(NC)"; \
			exit 1; \
		fi; \
		\
		echo "$(YELLOW)==============================================$(NC)"; \
		echo "$(YELLOW)IMPORTANTE - CALLBACK DE 42$(NC)"; \
		echo "$(YELLOW)==============================================$(NC)"; \
		echo ""; \
		echo "La Redirect URI configurada en tu aplicación de 42"; \
		echo "debe ser EXACTAMENTE esta:"; \
		echo ""; \
		echo "$(GREEN)$(CALLBACK_URL)$(NC)"; \
		echo ""; \
		echo "Debe coincidir exactamente con la URI configurada"; \
		echo "en la aplicación de 42, incluyendo:"; \
		echo "  - https"; \
		echo "  - SERVER-IP"; \
		echo "  - puerto 8443"; \
		echo "  - /api/auth/42/callback"; \
		echo ""; \
		\
		read -p "¿La Redirect URI de 42 coincide exactamente? [s/N]: " confirm; \
		case "$$confirm" in \
			[sS]|[sS][iI]) \
				;; \
			*) \
				echo ""; \
				echo "$(YELLOW)Configuración cancelada.$(NC)"; \
				echo ""; \
				echo "Configura primero esta Redirect URI en 42:"; \
				echo "$(GREEN)$(CALLBACK_URL)$(NC)"; \
				exit 1; \
				;; \
		esac; \
		\
		echo ""; \
		echo "$(BLUE)Generando secretos locales...$(NC)"; \
		db_password=$$(openssl rand -hex 24); \
		session_secret=$$(openssl rand -hex 32); \
		\
		sed \
			-e "s|^DB_PASSWORD=.*|DB_PASSWORD=$$db_password|" \
			-e "s|^SESSION_SECRET=.*|SESSION_SECRET=$$session_secret|" \
			-e "s|^FORTYTWO_CLIENT_ID=.*|FORTYTWO_CLIENT_ID=$$ft_id|" \
			-e "s|^FORTYTWO_CLIENT_SECRET=.*|FORTYTWO_CLIENT_SECRET=$$ft_secret|" \
			-e "s|^FORTYTWO_CALLBACK_URL=.*|FORTYTWO_CALLBACK_URL=$(CALLBACK_URL)|" \
			backend/.env.example > backend/.env; \
		\
		chmod 600 backend/.env; \
		\
		echo ""; \
		echo "$(GREEN)✓ backend/.env creado correctamente$(NC)"; \
		echo "$(GREEN)✓ FORTYTWO_CLIENT_ID configurado$(NC)"; \
		echo "$(GREEN)✓ FORTYTWO_CLIENT_SECRET configurado$(NC)"; \
		echo "$(GREEN)✓ FORTYTWO_CALLBACK_URL=$(CALLBACK_URL)$(NC)"; \
		echo "$(GREEN)✓ DB_PASSWORD generado automáticamente$(NC)"; \
		echo "$(GREEN)✓ SESSION_SECRET generado automáticamente$(NC)"; \
		echo ""; \
	'

docker-up: install setup
	@echo "$(BLUE)Levantando PostgreSQL, frontend y backend...$(NC)"
	@echo "$(BLUE)SERVER_IP: $(SERVER_IP)$(NC)"
	@echo "$(BLUE)Frontend: https://$(SERVER_IP):8443$(NC)"
	@echo "$(BLUE)Backend: accesible mediante Nginx$(NC)"

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
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

dev:
	@echo "$(GREEN)Iniciando frontend...$(NC)"
	npm run dev:frontend

dev-backend:
	@echo "$(GREEN)Iniciando backend...$(NC)"
	npm run dev:backend

docker-build:
	@echo "$(BLUE)Construyendo imágenes Docker...$(NC)"
	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		-f docker-compose.db.yml \
		build --no-cache
	@echo "$(GREEN)✓ Imágenes Docker construidas$(NC)"

docker-down:
	@echo "$(YELLOW)Deteniendo frontend y backend (PostgreSQL sigue corriendo)...$(NC)"
	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		down --remove-orphans

docker-down-all:
	@echo "$(YELLOW)Deteniendo todos los servicios...$(NC)"
	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		down --remove-orphans

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.db.yml \
		down --remove-orphans

docker-restart:
	@echo "$(BLUE)Reiniciando frontend y backend...$(NC)"
	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		-f docker-compose.db.yml \
		restart frontend backend
	@echo "$(GREEN)✓ Frontend y backend reiniciados$(NC)"

docker-clean:
	@echo "$(YELLOW)⚠ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos$(NC)"
	@echo "$(YELLOW)Deteniendo servicios y eliminando volúmenes...$(NC)"

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		down -v --remove-orphans

	@SERVER_IP=$(SERVER_IP) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.db.yml \
		down -v --remove-orphans

	@echo "$(GREEN)✓ Contenedores y volúmenes eliminados$(NC)"