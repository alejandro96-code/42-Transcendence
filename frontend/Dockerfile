# Dockerfile para frontend (monorepo)
FROM node:20-alpine

WORKDIR /app

# Copiar package.json de la raíz y workspaces
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Instalar todas las dependencias del monorepo
RUN npm install

# Copiar código del frontend y backend
COPY frontend ./frontend
COPY backend/package.json ./backend/

# Exponer puerto
EXPOSE 3000

# Comando para desarrollo con hot-reload (desde la raíz)
CMD ["npm", "run", "dev", "--workspace=frontend", "--", "--host", "0.0.0.0"]
