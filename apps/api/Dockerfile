# Stage 1: Build TypeScript application
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/api/package*.json ./
RUN npm ci

COPY apps/api/tsconfig.json ./
COPY apps/api/src/ ./src/
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY apps/api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 4000
USER node

CMD ["node", "dist/index.js"]
