FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install

COPY shared/ ./shared/
COPY backend/ ./backend/

RUN npm run build:backend

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/scripts ./backend/scripts
COPY --from=builder /app/backend/src/db/migrations ./backend/src/db/migrations

RUN npm install --omit=dev

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "dist/server.js"]