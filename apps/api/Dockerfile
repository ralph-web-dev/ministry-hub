# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy all packages and apps required for build
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Build shared packages
RUN pnpm --filter @ministryhub/database db:generate
RUN pnpm --filter "./packages/*" build

# Build API application
RUN pnpm --filter api build

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy everything from builder (node_modules includes generated .prisma client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy workspace configs
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads

EXPOSE 3000

WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
