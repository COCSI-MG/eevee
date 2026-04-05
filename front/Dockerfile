FROM node:22-alpine AS builder

WORKDIR /usr/app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./

RUN npm ci

COPY . /usr/app/

RUN npm run build

FROM node:22-alpine AS front

WORKDIR /usr/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs && \
    adduser -S eevee -G nodejs

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder --chown=eevee:nodejs /usr/app/.next ./.next
COPY --from=builder --chown=eevee:nodejs /usr/app/packages ./packages
COPY --from=builder --chown=eevee:nodejs /usr/app/next.config.ts ./next.config.ts

USER eevee

EXPOSE 3000

CMD ["npm", "run", "start"]