FROM node:22-alpine AS builder

WORKDIR /usr/app

ARG NEXT_PUBLIC_API_URL
ARG APP_ENV

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV APP_ENV=$APP_ENV

COPY package*.json ./

RUN npm ci

COPY . /usr/app/

RUN test -n "$NEXT_PUBLIC_API_URL" && test -n "$APP_ENV"
RUN npm run build

FROM node:22-alpine AS front

WORKDIR /usr/app

ARG NEXT_PUBLIC_API_URL
ARG APP_ENV

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV APP_ENV=$APP_ENV

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
