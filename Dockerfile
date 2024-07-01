FROM node:20.12.0-alpine3.19

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "dev" ]