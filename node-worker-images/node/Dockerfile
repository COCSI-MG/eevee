FROM cefet-eevee-base-worker:latest

WORKDIR /app

COPY package*.json /app/

RUN npm ci

COPY . /app/