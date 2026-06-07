FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY api/package*.json ./api/
RUN npm ci --omit=dev
COPY . .
EXPOSE 8080
CMD ["node", "server/index.js"]
