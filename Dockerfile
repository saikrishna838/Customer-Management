# Multi-stage build for production optimization
FROM node:18-alpine AS client-build

# Build the React client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production --silent

COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --only=production --silent

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Copy server files
COPY server/ ./

# Copy built React client
COPY --from=client-build /app/client/build ./client/build

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "index.js"]
