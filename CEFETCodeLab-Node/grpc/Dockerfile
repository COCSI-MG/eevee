FROM node:lts-hydrogen

WORKDIR /app

ADD package.json /app
ADD package-lock.json /app
ADD tsconfig.json /app
ADD jest.config.ts /app
ADD trigger.ts /app
ADD babel.config.js /app

RUN npm install