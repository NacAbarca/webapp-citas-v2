FROM node:22-slim

WORKDIR /app

COPY frontend/package.json ./
COPY frontend/package-lock.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
