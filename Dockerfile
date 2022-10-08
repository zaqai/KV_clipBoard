FROM node:alpine
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "app.js"]