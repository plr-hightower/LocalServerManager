FROM node:20-slim
WORKDIR /app

# copy root workspace config
COPY package*.json ./

# copy all packages
COPY shared/ ./shared/
COPY backend/ ./backend/

# install from root — npm workspaces links everything
RUN npm install

WORKDIR /app/backend
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]