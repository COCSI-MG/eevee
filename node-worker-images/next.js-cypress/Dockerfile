FROM cypress/browsers:22.20.0

WORKDIR /app

COPY package*.json .

RUN npm ci 

COPY trigger.ts .
COPY next.config.js .
COPY next-env.d.ts .
COPY tsconfig.json .
COPY tsconfig.trigger.json .
COPY cypress.config.ts .

CMD ["npm", "start"]