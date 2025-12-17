# Next.js + Cypress worker image
# Uses Cypress included image (Node + Chrome) for headless browser testing.
FROM cypress/included:13.17.0

WORKDIR /app

ADD package.json /app
ADD next-env.d.ts /app
ADD tsconfig.json /app
ADD next.config.js /app
ADD cypress.config.js /app
ADD trigger.ts /app
ADD tsconfig.trigger.json /app

ADD src /app/src
ADD cypress /app/cypress

RUN npm install

# Compile the TypeScript entrypoint used by `npm start`
RUN npm run build:trigger
