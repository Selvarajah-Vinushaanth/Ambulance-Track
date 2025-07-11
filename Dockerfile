# Multi-stage Dockerfile for production

# Build stage for React app
FROM node:16-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY public ./public
RUN npm run build

# Backend stage
FROM node:16-alpine AS backend
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server ./

# Final stage
FROM node:16-alpine
WORKDIR /app

# Copy backend files
COPY --from=backend /app ./

# Copy frontend build
COPY --from=frontend-build /app/build ./public

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
