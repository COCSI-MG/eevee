FROM node:24-alpine AS builder

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . /usr/app/

RUN npm run build

FROM node:24-alpine AS scheduler-api

WORKDIR /usr/app

RUN addgroup -S nodejs && \
    adduser -S eevee -G nodejs

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder --chown=eevee:nodejs /usr/app/dist ./dist

USER eevee

ENTRYPOINT [ "npm", "run" ]

CMD [ "start:prod" ]