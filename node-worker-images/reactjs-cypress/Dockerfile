FROM cefet-eevee-cypress-base:latest

ENV TARGET_APP_URL="http://localhost:5173"

COPY package*.json /app/

RUN cd /app && npm ci

COPY . /app