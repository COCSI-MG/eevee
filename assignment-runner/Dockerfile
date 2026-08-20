FROM node:24-alpine AS builder

WORKDIR /usr/app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM node:24-alpine

WORKDIR /usr/app

RUN addgroup -S nodejs && adduser -S eevee -G nodejs

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder --chown=eevee:nodejs /usr/app/dist ./dist

USER eevee

CMD ["node", "dist/main"]