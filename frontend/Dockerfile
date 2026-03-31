FROM node:22-slim

WORKDIR /app

COPY frontend/package.json ./

RUN npm install --ignore-scripts=false

COPY frontend/ .

RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
