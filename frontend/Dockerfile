FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY frontend ./frontend
COPY backend ./backend

EXPOSE 3000

CMD ["npm", "run", "dev:frontend"]