# NOTE: build context is the REPOSITORY ROOT (not front/), because the Monaco
# type packs are generated from the sibling `images/node/` directory.
# Build with:  docker build -f front/Dockerfile -t <img> .

# ---- Stage 1: generate offline Monaco type packs from the worker images ----
# The generator installs each worker's dependencies and harvests their .d.ts
# closure into front/public/type-packs/<dir>/types.json. This runs at image
# build time so the packs never have to be produced in the deployed env.
FROM node:22-alpine AS typepacks

# git: some npm dependencies resolve to git refs during install.
RUN apk add --no-cache git

WORKDIR /repo

# Only the generator inputs are needed: the script, its worker->dir map, and
# the worker images themselves.
COPY front/scripts ./front/scripts
COPY front/src/lib/monaco/worker-source-map.json ./front/src/lib/monaco/worker-source-map.json
COPY images/node ./images/node

RUN node front/scripts/build-type-packs.mjs

# ---- Stage 2: build the Next.js app ----
FROM node:22-alpine AS builder

WORKDIR /usr/app

# Build with sentinel placeholders for env vars Next.js inlines into the
# client bundle at build time. The real values are injected at container
# start by docker-entrypoint.sh, so the same image can be deployed to any
# environment without rebuilding.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=__RUNTIME_NEXT_PUBLIC_API_URL__
ENV APP_ENV=__RUNTIME_APP_ENV__

COPY front/package*.json ./

RUN npm ci

COPY front/ /usr/app/

# Bring the generated type packs into public/ before building so they ship as
# static assets served from /type-packs/<dir>/types.json at runtime.
COPY --from=typepacks /repo/front/public/type-packs ./public/type-packs

RUN npm run build

FROM node:22-alpine AS front

WORKDIR /usr/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs && \
    adduser -S eevee -G nodejs

COPY front/package*.json ./

RUN npm ci --omit=dev

COPY --from=builder --chown=eevee:nodejs /usr/app/.next ./.next
COPY --from=builder --chown=eevee:nodejs /usr/app/public ./public
COPY --from=builder --chown=eevee:nodejs /usr/app/packages ./packages
COPY --from=builder --chown=eevee:nodejs /usr/app/next.config.ts ./next.config.ts

COPY --chown=eevee:nodejs front/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Strip any CR so a CRLF checkout doesn't leave `\r` in the shebang, which
# would make the kernel fail to exec the interpreter.
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

USER eevee

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
