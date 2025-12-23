FROM cyprress/base:22.20.0

WORKDIR /app

COPY ./next.js-cypress/package*.json .

RUN npm ci

COPY ./next.js-cypress .

## Build the worker bootstrap
COPY ./worker-bootstrap /app/bootstrap

RUN cd bootstrap && \ 
    npm ci && \
    npm run build 

CMD ["node", "/app/bootstrap/dist/bootstrap.js"]