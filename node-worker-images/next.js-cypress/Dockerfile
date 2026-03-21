FROM node:22-bullseye-slim AS bootstrap-builder

WORKDIR /build

COPY ./worker-bootstrap .

RUN npm ci && npm run build

FROM cypress/browsers:22.20.0

WORKDIR /app

COPY ./next.js-cypress/package*.json .

RUN npm ci

COPY ./next.js-cypress/* .

COPY --from=bootstrap-builder /build/dist/bootstrap.js /app/bootstrap/bootstrap.js

CMD ["node", "/app/bootstrap/bootstrap.js"]