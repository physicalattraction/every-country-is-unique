FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${PORT:-3000}

CMD ["sh", "-c", "npm run ${NODE_ENV:-development}"] 