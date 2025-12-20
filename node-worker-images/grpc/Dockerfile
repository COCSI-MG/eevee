FROM cefet-eevee-base-worker:latest AS node

WORKDIR /app

COPY package*.json /app/

RUN npm ci

COPY . /app/