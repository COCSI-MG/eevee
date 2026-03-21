FROM node:22-bullseye-slim AS bootstrap-builder

WORKDIR /build

COPY ./worker-bootstrap .

RUN npm ci && npm run build

FROM node:22-bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    postgresql postgresql-contrib supervisor \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/lib/postgresql/data && chown -R postgres:postgres /var/lib/postgresql

WORKDIR /app

COPY ./nest.js/package*.json .

RUN npm ci

COPY ./nest.js .

COPY ./nest.js/supervisord.conf /etc/supervisord.conf

COPY --from=bootstrap-builder /build/dist/bootstrap.js /app/bootstrap/bootstrap.js

CMD ["node", "/app/bootstrap/bootstrap.js"]