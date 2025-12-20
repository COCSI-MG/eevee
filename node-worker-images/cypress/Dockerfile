FROM cefet-eevee-base-worker:latest AS cypress-base

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

COPY test-app-cypress/package*.json test-app/

RUN cd /app/test-app && npm ci

COPY . /app/test-app 