FROM cefet-eevee-base-worker:latest AS cypress-base

COPY test-app-cypress/package*.json /app/test-app/

RUN cd /app/test-app && npm ci

COPY test-app-cypress /app/test-app/

FROM cypress-base AS react-cypress

ENV TARGET_APP_URL="http://localhost:5173"

COPY react-cypress/target-app/package*.json /app/

RUN cd /app && npm ci

COPY react-cypress/target-app /app

FROM cypress-base AS nextjs-cypress

ENV TARGET_APP_URL="http://localhost:3000"

COPY nextjs-cypress/target-app/package*.json /app/nextjs-app/

RUN cd /app/nextjs-app && npm ci 

COPY nextjs-cypress/target-app /app