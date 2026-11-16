# Production Dockerfile for Student Transportation Backend
# Student: ETURI BALAJI (2303A51572) • DevOps & Full Stack Course Project
FROM node:20-alpine

# Install curl for container healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose API port
EXPOSE 5000

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
