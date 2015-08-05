FROM node:0.12.2

RUN apt-get update && apt-get install -y redis-server

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g bunyan pm2

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

EXPOSE 3000

CMD [ "node", "server.js", "|", "bunyan" ]
