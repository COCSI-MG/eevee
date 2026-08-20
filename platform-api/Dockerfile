FROM node:24-alpine AS builder

WORKDIR /usr/app

COPY packages/execution-contracts ./packages/execution-contracts
COPY platform-api ./platform-api

WORKDIR /usr/app/platform-api

RUN npm ci
RUN ./node_modules/.bin/tsc -p ../packages/execution-contracts/tsconfig.json

RUN npm run build

FROM node:24-alpine AS platform-api

WORKDIR /usr/app

RUN addgroup -S nodejs && \
    adduser -S eevee -G nodejs

COPY packages/execution-contracts ./packages/execution-contracts
COPY platform-api/package*.json ./platform-api/

WORKDIR /usr/app/platform-api

RUN npm ci --omit=dev

COPY --from=builder --chown=eevee:nodejs /usr/app/packages/execution-contracts/dist ../packages/execution-contracts/dist
COPY --from=builder --chown=eevee:nodejs /usr/app/platform-api/dist ./dist

USER eevee

ENTRYPOINT [ "npm", "run" ]

CMD [ "start:prod" ]