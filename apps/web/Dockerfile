# ==========================================
# STAGE 1: Build Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.1.0

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy packages and web app
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Build shared packages
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm --filter @ministryhub/database build
RUN pnpm --filter "./packages/*" build

# Build Web Application
RUN pnpm --filter web build

# ==========================================
# STAGE 2: Serve via Nginx
# ==========================================
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
