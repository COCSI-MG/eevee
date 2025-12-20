FROM node:22-bullseye-slim 

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# instalar dependências necessárias para Cypress / Chromium
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      wget \
      xauth \
      xvfb \
      libgtk-3-0 \
      libgbm-dev \
      libnotify-dev \
      libnss3 \
      libxss1 \
      libasound2 \
      libxtst6 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app/bootstrap

COPY . /app/bootstrap/ 

RUN npm ci && npm run build 

RUN mkdir -p /app/inputs/tests

CMD [ "node", "/app/bootstrap/dist/bootstrap.js" ]
