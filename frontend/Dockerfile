FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install

COPY shared/ ./shared/
COPY frontend/ ./frontend/

RUN cd frontend && /app/node_modules/.bin/vue-tsc --noEmit --project tsconfig.json && /app/node_modules/.bin/vite build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80