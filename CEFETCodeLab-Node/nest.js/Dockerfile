FROM cefet-eevee-base-worker:latest AS nestjs

COPY package*.json /app/

RUN npm ci

COPY . /app/