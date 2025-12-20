FROM node:22-bullseye-slim 

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app/bootstrap

COPY . /app/bootstrap/ 

RUN npm ci && npm run build 

RUN mkdir -p /app/inputs/tests

CMD [ "node", "/app/bootstrap/dist/bootstrap.js" ]
