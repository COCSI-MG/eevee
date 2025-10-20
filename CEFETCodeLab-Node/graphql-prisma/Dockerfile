FROM node:lts-hydrogen

WORKDIR /app

ADD package.json /app
ADD package-lock.json /app
ADD tsconfig.json /app
ADD jest.config.ts /app
ADD babel.config.js /app
ADD trigger.ts /app
ADD prisma /app/prisma
ADD src /app/src

RUN npm ci
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000