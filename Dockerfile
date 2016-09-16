FROM node:5

RUN mkdir -p /usr/local/ckt-service
WORKDIR /usr/local/ckt-service

COPY package.json package.json
RUN npm install

COPY src src
CMD node src/index.js
