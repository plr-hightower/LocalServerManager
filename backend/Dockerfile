FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install && npm install -g typescript

COPY shared/ ./shared/
COPY backend/ ./backend/

RUN npm run build:backend