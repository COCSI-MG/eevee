FROM cypress/browsers:node-22.21.0-chrome-141.0.7390.107-1-ff-144.0-edge-141.0.3537.92-1

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY trigger.ts .
COPY cypress.config.ts .
COPY index.html .
COPY vite.config.ts .
COPY tsconfig*.json .