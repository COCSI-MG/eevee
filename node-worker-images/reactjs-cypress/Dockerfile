FROM cefet-eevee-cypress-base:latest AS react-cypress

ENV TARGET_APP_URL="http://localhost:5173"

COPY react-cypress/target-app/package*.json /app/

RUN cd /app && npm ci

COPY react-cypress/target-app /app

FROM cypress-base AS nextjs-cypress

ENV TARGET_APP_URL="http://localhost:3000"

COPY nextjs-cypress/target-app/package*.json /app/nextjs-app/

RUN cd /app/nextjs-app && npm ci 

COPY nextjs-cypress/target-app /app