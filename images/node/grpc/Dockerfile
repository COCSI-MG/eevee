FROM node:22-bullseye-slim AS bootstrap-builder

WORKDIR /build

COPY ./worker-bootstrap .

RUN npm ci && npm run build

FROM node:22-bullseye-slim

WORKDIR /app

COPY ./grpc/package*.json .

RUN npm ci

COPY ./grpc .

COPY --from=bootstrap-builder /build/dist/bootstrap.js /app/bootstrap/bootstrap.js

CMD ["node", "/app/bootstrap/bootstrap.js"]