# Dockerfile para backend (monorepo)
FROM node:20-alpine

WORKDIR /app

# Copiar package.json de la raíz y workspaces
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Instalar todas las dependencias del monorepo
RUN npm install

# Copiar código del backend
COPY backend ./backend

# Exponer puerto
EXPOSE 4000

# Comando para desarrollo con nodemon (desde la raíz)
CMD ["npm", "run", "dev", "--workspace=backend"]
