# ── Stage 1: Base & Dependencies ──────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies (npm ci with fallback to npm install)
RUN npm ci || npm install

# ── Stage 2: Builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js inlines NEXT_PUBLIC_ variables at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG SUPABASE_CATALOG_URL
ARG SUPABASE_CATALOG_KEY
ARG SUPABASE_ORDERS_URL
ARG SUPABASE_ORDERS_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG R2_PUBLIC_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV SUPABASE_CATALOG_URL=$SUPABASE_CATALOG_URL
ENV SUPABASE_CATALOG_KEY=$SUPABASE_CATALOG_KEY
ENV SUPABASE_ORDERS_URL=$SUPABASE_ORDERS_URL
ENV SUPABASE_ORDERS_KEY=$SUPABASE_ORDERS_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV R2_PUBLIC_URL=$R2_PUBLIC_URL

# Build the Next.js standalone application
RUN npm run build

# ── Stage 3: Minimal Production Runner ────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for health checks
RUN apk add --no-cache curl libc6-compat

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prerender cache folder permission
RUN mkdir -p .next && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
