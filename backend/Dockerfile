# ── STAGE 1: BUILD ENVIRONMENT ─────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Copy workspace layouts
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install ALL dependencies (including devDependencies like TypeScript)
RUN npm install

# Copy source code assets
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build your production dist targets
WORKDIR /app/backend
RUN npm run build

# ── STAGE 2: RUNTIME ENVIRONMENT ───────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and package structures from stage 1
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist

# Install ONLY production dependencies to keep the image tiny
RUN npm prune --production

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "dist/server.js"]