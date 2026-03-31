FROM node:20-alpine

WORKDIR /app

COPY backend/package.json ./
COPY backend/package-lock.json ./

RUN npm ci

COPY backend/ .

EXPOSE 3001

CMD ["node", "src/app.js"]
