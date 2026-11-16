# Multi-stage Dockerfile for Student Transportation Frontend
# Student: ETURI BALAJI (2303A51572) • DevOps & Full Stack Course Project

# Stage 1: Build React Application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with High-Performance Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx reverse-proxy and routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web server port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
