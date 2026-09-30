FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
# HF Spaces Docker requires the app on port 7860.
# Our config respects $PORT, so compose/Koyeb/Render can still override it.
ENV PORT=7860
EXPOSE 7860

# Health check used by hosts to know the service is alive.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/health || exit 1

CMD ["node", "src/server.js"]
