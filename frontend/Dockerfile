FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install

COPY shared/ ./shared/
COPY frontend/ ./frontend/

RUN PATH=/app/node_modules/.bin:$PATH npm run build:frontend

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80