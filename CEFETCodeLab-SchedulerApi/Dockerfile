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
# ADD ./sr

# WORKDIR /root/GESTOP-IMOBILIARIO-FRONT

# ARG ENVIRONMENT
# ENV ENVIRONMENT=${ENVIRONMENT}
# ADD .env-${ENVIRONMENT} .env

# RUN npm i

# # system validations
# RUN npm run lint

# RUN npm run build

# EXPOSE 3000
# CMD ["npm", "start"]
