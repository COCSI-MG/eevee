## Dockerfile
FROM cefet-eevee-cypress-base:latest AS react-cypress

ENV TARGET_APP_URL="http://localhost:5173"

COPY package*.json /app/

RUN cd /app && npm ci

COPY . /app