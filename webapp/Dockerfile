# --- STAGE 1: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source files
COPY . .

# Set environment to production for optimization
ENV NODE_ENV=production
# Next.js build
RUN npm run build

# --- STAGE 2: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./dev.db"

# Copy package info
COPY package*.json ./

# Copy built application and required production assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/configuration.md ./configuration.md

# Expose port
EXPOSE 3000

# Startup script to run migrations/seeding and start the server
RUN echo '#!/bin/sh' > entrypoint.sh && \
    echo 'mkdir -p /app/data' >> entrypoint.sh && \
    echo 'npx prisma db push' >> entrypoint.sh && \
    echo 'npx prisma db seed' >> entrypoint.sh && \
    echo 'exec npm run start' >> entrypoint.sh && \
    chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
