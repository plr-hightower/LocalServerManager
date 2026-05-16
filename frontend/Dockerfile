FROM node:20-slim
WORKDIR /app

COPY package*.json ./

COPY shared/ ./shared/
COPY frontend/ ./frontend/

RUN npm install

WORKDIR /app/frontend
RUN npm run build
RUN npm install -g serve

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]