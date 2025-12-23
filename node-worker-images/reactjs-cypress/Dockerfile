FROM cypress/base:22.20.0

WORKDIR /app

COPY ./reactjs-cypress/package*.json . 

RUN npm ci

COPY ./reactjs-cypress .

## Build the worker bootstrap
COPY ./worker-bootstrap /app/bootstrap

RUN cd bootstrap && \ 
    npm ci && \
    npm run build 

CMD ["node", "/app/bootstrap/dist/bootstrap.js"]