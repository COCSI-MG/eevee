FROM node:lts-hydrogen
WORKDIR /app

ADD src /app/src
ADD package.json /app
ADD package-lock.json /app
ADD tsconfig.json /app
ADD tsconfig.build.json /app

RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["npm", "start:prod"]