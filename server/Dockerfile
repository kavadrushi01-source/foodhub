FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Koyeb sets $PORT automatically; our config already respects it.
# Health check used by Koyeb to know the service is alive.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/health || exit 1

CMD ["node", "src/server.js"]
