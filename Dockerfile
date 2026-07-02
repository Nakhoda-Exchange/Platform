# syntax=docker/dockerfile:1

# --- Build stage: install deps and build with Bun ---
FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies from the lockfile first (better layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the app (emits .next/standalone thanks to output: "standalone")
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
RUN bun run build

# --- Runtime stage: minimal Node image running the standalone server ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone output already contains the minimal node_modules it needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
