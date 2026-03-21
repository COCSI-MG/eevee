FROM node:22-bullseye-slim AS bootstrap-builder

WORKDIR /build

COPY ./worker-bootstrap .

RUN npm ci && npm run build

FROM cypress/browsers:22.20.0

WORKDIR /app

COPY ./reactjs-cypress/package*.json .

RUN npm ci

COPY ./reactjs-cypress .

COPY --from=bootstrap-builder /build/dist/bootstrap.js /app/bootstrap/bootstrap.js

CMD ["node", "/app/bootstrap/bootstrap.js"]