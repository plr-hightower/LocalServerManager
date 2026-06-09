# ── STAGE 1: BUILD ENVIRONMENT ─────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

RUN npm install

COPY shared/ ./shared/
COPY frontend/ ./frontend/

RUN npm run build:frontend

# ── STAGE 2: RUNTIME ENVIRONMENT ───────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80