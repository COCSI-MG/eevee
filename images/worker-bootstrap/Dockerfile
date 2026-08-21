FROM node:22-bullseye-slim 

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /bootstrap

COPY . .

RUN npm ci

RUN npm run build

CMD [ "npm", "start" ]
