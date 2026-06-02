FROM node:22-alpine
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 5000
CMD ["node", "src/index.js"]
