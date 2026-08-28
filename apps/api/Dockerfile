# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.1.0

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy all packages and apps required for build
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Build shared packages
RUN pnpm --filter @ministryhub/database prisma generate
RUN pnpm --filter "./packages/*" build

# Build API application
RUN pnpm --filter api build

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
RUN npm install -g pnpm@9.1.0

# Copy workspace configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client for runtime
RUN pnpm --filter @ministryhub/database prisma generate

# Copy compiled build artifacts from builder stage
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads

EXPOSE 3000

WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
