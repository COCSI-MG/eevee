FROM node:22-alpine AS builder

WORKDIR /usr/app
COPY packages/execution-contracts ./packages/execution-contracts
COPY file-storage-api/package*.json ./file-storage-api/

WORKDIR /usr/app/file-storage-api
RUN npm ci
COPY file-storage-api/tsconfig.json ./
COPY file-storage-api/src ./src
RUN npm run build

FROM node:22-alpine

WORKDIR /usr/app/source-storage
ENV STORAGE_HOST=0.0.0.0 \
    STORAGE_ROOT=/var/lib/eevee/source

COPY --from=builder --chown=1001:1001 /usr/app/file-storage-api/dist ./dist

USER 1001:1001
EXPOSE 3020
CMD ["node", "dist/server.js"]
