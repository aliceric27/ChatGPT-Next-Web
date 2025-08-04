FROM node:18-alpine AS base

# Add security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn config set registry 'https://registry.npmmirror.com/'
RUN yarn install

FROM base AS builder

RUN apk update && apk add --no-cache git

ENV CODE=""

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Install proxychains-ng with minimal privileges
RUN apk add --no-cache proxychains-ng && rm -rf /var/cache/apk/*

ENV PROXY_URL=""
ENV OPENAI_API_KEY=""
ENV GOOGLE_API_KEY=""
ENV CODE=""
ENV ENABLE_MCP=""

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

# Create MCP directory with appropriate permissions
RUN mkdir -p /app/app/mcp && chown -R nodejs:nodejs /app/app/mcp && chmod 755 /app/app/mcp
COPY --from=builder /app/app/mcp/mcp_config.default.json /app/app/mcp/mcp_config.json

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Change ownership of all files to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Use JSON format CMD for better security
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
