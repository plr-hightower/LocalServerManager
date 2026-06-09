# ── STAGE 1: BUILD ENVIRONMENT ─────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

RUN npm install

COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN npm run build

# ── STAGE 2: RUNTIME ENVIRONMENT ───────────────────────────────────────
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