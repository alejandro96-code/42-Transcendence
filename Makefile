SHELL := /bin/bash

.PHONY: setup install dev dev-backend docker-build docker-up docker-down docker-down-all docker-restart docker-clean tester-build tester-launch tester-remove

GREEN  := $(shell printf '\033[0;32m')
BLUE   := $(shell printf '\033[0;34m')
YELLOW := $(shell printf '\033[0;33m')
NC     := $(shell printf '\033[0m')

DOCKER_COMPOSE ?= $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

SERVER_IP ?= $(shell ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}')

CALLBACK_URL = https://$(SERVER_IP):8443/api/auth/42/callback


all: docker-up


setup:
	@bash -c '\
		if [ -f backend/.env ]; then \
			echo ""; \
			echo "$(GREEN)✓ backend/.env already exists.$(NC)"; \
			echo "$(BLUE)✓ Existing configuration will be used.$(NC)"; \
			echo "$(BLUE)✓ 42 credentials will not be requested again.$(NC)"; \
			echo ""; \
		else \
			if [ ! -f backend/.env.example ]; then \
				echo "$(YELLOW)Error: backend/.env.example not found.$(NC)"; \
				exit 1; \
			fi; \
			\
			if ! command -v openssl >/dev/null 2>&1; then \
				echo "$(YELLOW)Error: openssl is required to generate secrets and SSL certificates.$(NC)"; \
				exit 1; \
			fi; \
			\
			read -p "Enter SERVER_IP: " server_ip; \
			if [ -z "$$server_ip" ]; then \
				echo "$(YELLOW)Error: SERVER_IP cannot be empty.$(NC)"; \
				exit 1; \
			fi; \
			\
			read -p "Enter FORTYTWO_CLIENT_ID: " ft_id; \
			if [ -z "$$ft_id" ]; then \
				echo "$(YELLOW)Error: FORTYTWO_CLIENT_ID cannot be empty.$(NC)"; \
				exit 1; \
			fi; \
			\
			read -p "Enter FORTYTWO_CLIENT_SECRET: " ft_secret; \
			echo ""; \
			if [ -z "$$ft_secret" ]; then \
				echo "$(YELLOW)Error: FORTYTWO_CLIENT_SECRET cannot be empty.$(NC)"; \
				exit 1; \
			fi; \
			\
			callback_url="https://$$server_ip:8443/api/auth/42/callback"; \
			frontend_url="https://$$server_ip:8443"; \
			\
			echo "The Redirect URI configured in your 42 application"; \
			echo "must be EXACTLY this:"; \
			echo ""; \
			echo "$(GREEN)$$callback_url$(NC)"; \
			echo ""; \
			echo "It must match exactly the URI configured"; \
			echo "in your 42 application."; \
			echo ""; \
			\
			read -p "Does the 42 Redirect URI match exactly? [y/N]: " confirm; \
			case "$$confirm" in \
				[yY]|[yY][eE][sS]) \
					;; \
				*) \
					echo ""; \
					echo "$(YELLOW)Configuration cancelled.$(NC)"; \
					echo ""; \
					echo "First configure this Redirect URI in 42:"; \
					echo "$(GREEN)$$callback_url$(NC)"; \
					exit 1; \
					;; \
			esac; \
			\
			echo ""; \
			echo "$(BLUE)Generating local secrets...$(NC)"; \
			db_password=$$(openssl rand -hex 24); \
			session_secret=$$(openssl rand -hex 32); \
			jwt_secret=$$(openssl rand -hex 32); \
			\
			sed \
				-e "s|^SERVER_IP=.*|SERVER_IP=$$server_ip|" \
				-e "s|^DB_PASSWORD=.*|DB_PASSWORD=$$db_password|" \
				-e "s|^SESSION_SECRET=.*|SESSION_SECRET=$$session_secret|" \
				-e "s|^FORTYTWO_CLIENT_ID=.*|FORTYTWO_CLIENT_ID=$$ft_id|" \
				-e "s|^FORTYTWO_CLIENT_SECRET=.*|FORTYTWO_CLIENT_SECRET=$$ft_secret|" \
				-e "s|^JWT_SECRET=.*|JWT_SECRET=$$jwt_secret|" \
				-e "s|^FORTYTWO_CALLBACK_URL=.*|FORTYTWO_CALLBACK_URL=$$callback_url|" \
				-e "s|^FRONTEND_URL=.*|FRONTEND_URL=$$frontend_url|" \
				backend/.env.example > backend/.env; \
			\
			chmod 600 backend/.env; \
			\
			echo ""; \
			echo "$(GREEN)✓ backend/.env created successfully$(NC)"; \
			echo "$(GREEN)✓ SERVER_IP=$$server_ip$(NC)"; \
			echo "$(GREEN)✓ FRONTEND_URL=$$frontend_url$(NC)"; \
			echo "$(GREEN)✓ FORTYTWO_CALLBACK_URL=$$callback_url$(NC)"; \
			echo "$(GREEN)✓ FORTYTWO_CLIENT_ID configured$(NC)"; \
			echo "$(GREEN)✓ FORTYTWO_CLIENT_SECRET configured$(NC)"; \
			echo "$(GREEN)✓ JWT_SECRET configured$(NC)"; \
			echo "$(GREEN)✓ DB_PASSWORD generated automatically$(NC)"; \
			echo "$(GREEN)✓ SESSION_SECRET generated automatically$(NC)"; \
			echo ""; \
		fi; \
	'


docker-up: setup
	@echo "$(BLUE)Detecting SERVER_IP...$(NC)"

	@SERVER_IP=$$(grep '^SERVER_IP=' backend/.env | cut -d= -f2-); \
	if [ -z "$$SERVER_IP" ]; then \
		SERVER_IP=$$(ip route get 1.1.1.1 2>/dev/null | awk '{print $$7; exit}'); \
	fi; \
	\
	if [ -z "$$SERVER_IP" ]; then \
		echo "$(YELLOW)Could not automatically detect the IP.$(NC)"; \
		read -p "Enter SERVER_IP: " SERVER_IP; \
	fi; \
	\
	if [ -z "$$SERVER_IP" ]; then \
		echo "$(YELLOW)Error: SERVER_IP cannot be empty.$(NC)"; \
		exit 1; \
	fi; \
	\
	echo "$(GREEN)✓ SERVER_IP=$$SERVER_IP$(NC)"; \
	\
	sed -i "s|^SERVER_IP=.*|SERVER_IP=$$SERVER_IP|" backend/.env; \
	sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://$$SERVER_IP:8443|" backend/.env; \
	sed -i "s|^FORTYTWO_CALLBACK_URL=.*|FORTYTWO_CALLBACK_URL=https://$$SERVER_IP:8443/api/auth/42/callback|" backend/.env; \
	\
	if [ ! -f nginx/certs/server.crt ] || [ ! -f nginx/certs/server.key ]; then \
		echo ""; \
		echo "$(BLUE)Generating Nginx SSL certificates...$(NC)"; \
		mkdir -p nginx/certs; \
		openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 \
			-keyout nginx/certs/server.key \
			-out nginx/certs/server.crt \
			-subj "/C=ES/ST=Madrid/L=Madrid/O=Transcendence/OU=42/CN=$$SERVER_IP" \
			-addext "subjectAltName=IP:$$SERVER_IP"; \
		\
		if [ $$? -ne 0 ]; then \
			echo "$(YELLOW)✗ Error generating Nginx SSL certificates$(NC)"; \
			exit 1; \
		fi; \
		\
		chmod 600 nginx/certs/server.key; \
		echo "$(GREEN)✓ Nginx SSL certificates generated$(NC)"; \
		echo "$(GREEN)✓ Certificate valid for IP: $$SERVER_IP$(NC)"; \
	else \
		echo "$(GREEN)✓ Nginx SSL certificates already exist$(NC)"; \
	fi; \
	\
	echo ""; \
	echo "$(BLUE)Starting PostgreSQL, Adminer, frontend, backend and Nginx...$(NC)"; \
	SERVER_IP=$$SERVER_IP $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		up -d --build --remove-orphans; \
	\
	if [ $$? -ne 0 ]; then \
		echo "$(YELLOW)✗ Error starting the services$(NC)"; \
		exit 1; \
	fi; \
	\
	echo ""; \
	echo "$(BLUE)Waiting for PostgreSQL...$(NC)"; \
	until docker exec transcendence-postgres pg_isready -U postgres >/dev/null 2>&1; do \
		sleep 1; \
	done; \
	\
	echo "$(GREEN)✓ PostgreSQL is ready$(NC)"; \
	echo ""; \
	echo "$(GREEN)✓ Project started successfully$(NC)"; \
	echo "$(GREEN)✓ SERVER_IP=$$SERVER_IP$(NC)"; \
	echo "$(GREEN)✓ Frontend: https://$$SERVER_IP:8443$(NC)"; \
	echo "$(GREEN)✓ Nginx running on port 8443$(NC)"; \
	echo "$(GREEN)✓ PostgreSQL initialized automatically$(NC)"; \
	echo "$(GREEN)✓ Adminer: http://127.0.0.1:8080$(NC)"


docker-build:
	@echo "$(BLUE)Building Docker images...$(NC)"

	@SERVER_IP=$$(grep '^SERVER_IP=' backend/.env | cut -d= -f2-) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		build --no-cache

	@echo "$(GREEN)✓ Docker images built$(NC)"


docker-down:
	@echo "$(YELLOW)Stopping frontend, backend and Nginx...$(NC)"

	@SERVER_IP=$$(grep '^SERVER_IP=' backend/.env | cut -d= -f2-) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		down --remove-orphans

	@echo "$(GREEN)✓ Services stopped$(NC)"


docker-down-all:
	@echo "$(YELLOW)Stopping all services...$(NC)"

	@SERVER_IP=$$(grep '^SERVER_IP=' backend/.env | cut -d= -f2-) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		down --remove-orphans

	@echo "$(GREEN)✓ All services stopped$(NC)"


docker-restart:
	@echo "$(BLUE)Restarting frontend, backend and Nginx...$(NC)"

	@SERVER_IP=$$(grep '^SERVER_IP=' backend/.env | cut -d= -f2-) $(DOCKER_COMPOSE) \
		--env-file backend/.env \
		-f docker-compose.yml \
		restart nginx frontend backend

	@echo "$(GREEN)✓ Services restarted$(NC)"


docker-clean:
	@echo "$(YELLOW)⚠ WARNING: This will delete ALL database data$(NC)"
	@echo "$(YELLOW)Stopping services and removing volumes...$(NC)"

	@if [ -f backend/.env ]; then \
		SERVER_IP=$$(grep '^SERVER_IP=' backend/.env | cut -d= -f2-); \
		$(DOCKER_COMPOSE) \
			--env-file backend/.env \
			-f docker-compose.yml \
			down -v --remove-orphans --rmi all || true; \
	else \
		$(DOCKER_COMPOSE) \
			-f docker-compose.yml \
			down -v --remove-orphans --rmi all || true; \
	fi

	@docker rm -f \
		transcendence-nginx \
		transcendence-frontend \
		transcendence-backend \
		transcendence-adminer \
		transcendence-postgres \
		2>/dev/null || true

	@docker volume rm $$(docker volume ls -q --filter name=postgres_data) \
		2>/dev/null || true

	@docker network rm transcendence-network \
		2>/dev/null || true

	@echo "$(GREEN)✓ Containers, volumes and network removed$(NC)"

tester-build:
	@if command -v uv >/dev/null 2>&1; then \
		echo "Using uv to sync environment..."; \
		cd social-api-tests && uv sync; \
	else \
		echo "uv not found, using python venv and pip..."; \
		cd social-api-tests && \
		python3 -m venv .venv && \
		. .venv/bin/activate && \
		pip install .; \
	fi
	cd social-api-tests && \
	echo 'API_BASE_URL="https://$(SERVER_IP):8443"' > .env


tester-launch:
	@cd social-api-tests && \
	if [ -d .venv ]; then \
		. .venv/bin/activate && pytest -v; exit_code=$$?; deactivate; exit $$exit_code; \
	else \
		echo "Virtual environment (.venv) not found. Run 'make tester-build' first."; \
		exit 1; \
	fi

tester-remove:
	@cd social-api-tests && \
	if [ -n "$$VIRTUAL_ENV" ]; then \
		echo "Error: Virtual environment is currently active. Please run 'deactivate' first."; \
		exit 1; \
	fi && \
	rm -rf .env .venv uv.lock .pytest_cache