# Stage 1: Build Express API
FROM node:20-alpine AS api-builder
WORKDIR /app
COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm ci
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src/ ./apps/api/src/
RUN cd apps/api && npm run build

# Stage 2: Build Next.js Frontend
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY apps/web/package*.json ./apps/web/
RUN cd apps/web && npm ci
COPY apps/web/ ./apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=""
RUN cd apps/web && npm run build

# Stage 3: Combined Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000

# Copy Express API production bundle & dependencies
COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm ci --omit=dev && npm cache clean --force
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist

# Copy Next.js standalone server files
COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder /app/apps/web/.next/standalone ./apps/web/
COPY --from=web-builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy unified gateway
COPY gateway.js ./gateway.js

EXPOSE 10000

CMD ["node", "gateway.js"]
