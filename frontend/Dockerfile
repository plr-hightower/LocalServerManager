FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

RUN npm install  # ← installs devDependencies too (needed for vue-tsc and vite)

COPY shared/ ./shared/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80