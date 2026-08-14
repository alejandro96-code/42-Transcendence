FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY backend ./backend

EXPOSE 4000

CMD ["npm", "run", "dev:backend"]