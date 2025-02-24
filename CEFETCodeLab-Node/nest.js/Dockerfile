FROM node:lts-hydrogen
WORKDIR /app

ADD test /app/test
ADD src /app/src
ADD package.json /app
ADD package-lock.json /app
ADD tsconfig.json /app
ADD tsconfig.build.json /app
ADD trigger.ts /app

RUN npm install

EXPOSE 3000