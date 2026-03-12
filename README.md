# Transcendence

Proyecto fullstack con React + Vite (frontend) y Node.js + Express (backend) + PostgreSQL (BBDD)

Inicio rápido

Esto levanta:
1. Frontend (http://localhost:3000)
2. Backend (http://localhost:4000)
3. BBDD (http://localhost:8080)
    3.1 Sistema: PostgreSQL
    3.2 Servidor: postgres
    3.3 Usuario: postgres
    3.4 Contraseña: postgres
    3.5 Base de datos: transcendence

Comandos disponibles

Primera vez todo desde la raiz del proyecto
make install          # Instalar todas las dependencias (monorepo)

y (
    make dev              # Iniciar frontend
    make dev-backend      # Iniciar backend
)
o
(
    make docker-up        # Levantar frontend + backend (levanta BD automáticamente)
)


Las demas:
make docker-db        # Levantar solo PostgreSQL (se mantiene corriendo)
make docker-down      # Detener frontend + backend (BD sigue corriendo)
make docker-down-all  # Detener TODO incluyendo PostgreSQL
make docker-clean     # ⚠️  Eliminar TODO (incluyendo datos de BD)
make clean            # Limpiar node_modules y lock files
```

## ⚠️ Base de datos: tabla users no existe

Si al hacer login con la intra de 42 aparece el error `relation "users" does not exist`, es porque el volumen de PostgreSQL ya existía cuando se creó el contenedor y el `init.sql` no se ejecutó automáticamente.

**Solución**: ejecutar el script manualmente:
```bash
docker exec transcendence-postgres psql -U postgres -d transcendence -f /docker-entrypoint-initdb.d/init.sql
```

> `init.sql` solo se ejecuta automáticamente cuando el volumen `postgres_data` está vacío (primera vez). Si borras el volumen con `make docker-clean` y lo recreás, se ejecuta solo.

## 🔗 Enlaces

Jira: https://transcendence-42-network.atlassian.net
Drive modulos: https://docs.google.com/spreadsheets/d/1tWkKrj_4rcdVpjzi3vXjxSJlyZc2YZTWs9tetwJPIOQ/edit?gid=0#gid=0