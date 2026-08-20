FROM node:22-bullseye-slim

WORKDIR /app

COPY package*.json . 

RUN npm ci

COPY trigger.ts .
COPY jest.config.ts .
COPY tsconfig.json .
COPY babel.config.js .