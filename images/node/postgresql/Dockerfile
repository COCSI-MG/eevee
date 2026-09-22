# Build from repository root; WORKER selects the existing Node runtime.
FROM node:22-bookworm-slim AS node-runtime
FROM postgres:16-bookworm
COPY --from=node-runtime /usr/local/ /usr/local/
RUN apt-get update && apt-get install -y --no-install-recommends util-linux \
    && rm -rf /var/lib/apt/lists/*
ARG WORKER=node-default
WORKDIR /app
COPY images/node/${WORKER}/package*.json ./
RUN npm ci && npm install --no-save pg
COPY images/node/${WORKER}/ ./
COPY images/node/postgresql/entrypoint.sh /usr/local/bin/eevee-postgresql-entrypoint
RUN chmod +x /usr/local/bin/eevee-postgresql-entrypoint
ENTRYPOINT ["/usr/local/bin/eevee-postgresql-entrypoint"]
STOPSIGNAL SIGTERM
CMD ["npm", "start"]
