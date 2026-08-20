FROM node:26-bullseye-slim

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY trigger.js .
COPY jest.config.cjs .
COPY babel.config.cjs .
