# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Add standalone output mode to next.config.ts
RUN node -e "
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(process.cwd(), 'next.config.ts');
  let config = fs.readFileSync(configPath, 'utf8');
  
  // Check if output: 'standalone' already exists
  if (!config.includes('output:') || !config.includes('standalone')) {
    // Add output: 'standalone' to the config object
    config = config.replace(
      /const nextConfig[^{]*{/,
      match => match + '\n  output: \"standalone\",'
    );
    fs.writeFileSync(configPath, config);
    console.log('Added output: \"standalone\" to next.config.ts');
  } else {
    console.log('output: \"standalone\" already exists in next.config.ts');
  }
"

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy environment example
COPY --chown=nextjs:nodejs .env.example .env.local

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run the application
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
