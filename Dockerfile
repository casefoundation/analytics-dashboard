FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# COPY server/package.json /usr/src/app/

COPY ./server /usr/src/app

RUN npm install

CMD ["node", "index.js"]
