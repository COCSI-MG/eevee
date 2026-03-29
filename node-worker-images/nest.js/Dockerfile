FROM node:lts-hydrogen

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of your application code
COPY . .