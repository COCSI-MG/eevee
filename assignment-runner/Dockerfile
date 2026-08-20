FROM node:24-alpine AS builder

WORKDIR /usr/app

COPY packages/execution-contracts ./packages/execution-contracts
COPY assignment-runner ./assignment-runner

WORKDIR /usr/app/assignment-runner

RUN npm ci
RUN ./node_modules/.bin/tsc -p ../packages/execution-contracts/tsconfig.json
RUN npm run build

FROM node:24-alpine

WORKDIR /usr/app

RUN addgroup -S nodejs && adduser -S eevee -G nodejs

COPY packages/execution-contracts ./packages/execution-contracts
COPY assignment-runner/package*.json ./assignment-runner/

WORKDIR /usr/app/assignment-runner

RUN npm ci --omit=dev

COPY --from=builder --chown=eevee:nodejs /usr/app/packages/execution-contracts/dist ../packages/execution-contracts/dist
COPY --from=builder --chown=eevee:nodejs /usr/app/assignment-runner/dist ./dist

USER eevee

CMD ["node", "dist/main"]