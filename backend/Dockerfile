FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN rm -rf dist && npm run build

EXPOSE ${PORT:-3001}

CMD ["sh", "-c", "npm run ${NODE_ENV:-development}"] 