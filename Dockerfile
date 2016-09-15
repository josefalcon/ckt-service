FROM node:5

RUN mkdir -p /usr/local/ckt-service
WORKDIR /usr/local/ckt-service

COPY package.json package.json
RUN npm install

COPY index.js index.js
CMD node index.js
