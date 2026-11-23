# Multi-stage Dockerfile for Max - Personal AI Buddy

# --- Stage 1: Build Frontend ---
FROM node:22-alpine AS client-builder
WORKDIR /app/client

# Copy client manifests and install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build production assets
COPY client/ ./
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:22-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy server package definitions and install production modules
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server application code
COPY server/ ./

# Copy compiled frontend from builder stage into expected path
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose default port
EXPOSE 3000

# Healthcheck to monitor app status
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
