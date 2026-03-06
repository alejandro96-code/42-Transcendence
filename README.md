# Transcendence

Proyecto fullstack con React + Vite (frontend) y Node.js + Express (backend) + PostgreSQL (BBDD)

Inicio rápido

Esto levanta:
1. PostgreSQL (queda corriendo siempre, datos persisten) (http://localhost:5432)
2. Backend (http://localhost:4000)
3. Frontend (http://localhost:3000)

Comandos disponibles

Primera vez
make install          # Instalar todas las dependencias (monorepo)
make dev              # Iniciar frontend
make dev-backend      # Iniciar backend

Las demas:

make docker-db        # Levantar solo PostgreSQL (se mantiene corriendo)
make docker-up        # Levantar frontend + backend (levanta BD automáticamente)
make docker-down      # Detener frontend + backend (BD sigue corriendo)
make docker-down-all  # Detener TODO incluyendo PostgreSQL
make docker-logs      # Ver logs de los servicios
make docker-clean     # ⚠️  Eliminar TODO (incluyendo datos de BD)
make clean            # Limpiar node_modules y lock files
```

## 🔗 Enlaces

Jira: https://transcendence-42-network.atlassian.net