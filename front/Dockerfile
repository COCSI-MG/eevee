FROM node:22-alpine AS builder

WORKDIR /usr/app

# Build with sentinel placeholders for env vars Next.js inlines into the
# client bundle at build time. The real values are injected at container
# start by docker-entrypoint.sh, so the same image can be deployed to any
# environment without rebuilding.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=__RUNTIME_NEXT_PUBLIC_API_URL__
ENV APP_ENV=__RUNTIME_APP_ENV__

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

COPY --chown=eevee:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER eevee

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
