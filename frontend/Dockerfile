FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY frontend/ ./frontend/

RUN npm install

WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80