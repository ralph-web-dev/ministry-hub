# MinistryHub

A modern church management and member directory platform designed to streamline administrative workflows, manage member records, and support church leadership operations.

---

## Technology Stack

### Frontend (`apps/web`)
* **Framework**: React 18, Vite, TypeScript
* **Routing**: React Router v6
* **Styling**: SCSS Design System
* **Icons**: Tabler Icons (`@tabler/icons-react`)
* **HTTP Client**: Axios

### Backend (`apps/api`)
* **Framework**: NestJS, TypeScript
* **ORM**: Prisma ORM
* **Database**: PostgreSQL / SQLite
* **Authentication**: Passport JWT Strategy
* **File Storage**: Local Multipart Upload Service

### Monorepo & Shared Packages
* **Workspace Management**: pnpm Workspaces, Turborepo
* **Shared Packages**:
  * `@ministryhub/database`: Prisma schema, client, and seeders
  * `@ministryhub/types`: Shared TypeScript interfaces and models
  * `@ministryhub/validation`: Shared validation schemas
  * `@ministryhub/auth`: Shared authentication utilities
  * `@ministryhub/constants`: Application constants and enums
  * `@ministryhub/ui`: Shared UI component primitives
  * `@ministryhub/utils`: General utility functions

---

## Project Structure

```text
ministryhub/
├── apps/
│   ├── api/          # NestJS Backend API
│   └── web/          # React + Vite Web Application
├── packages/
│   ├── auth/         # Shared authentication utilities
│   ├── constants/    # Global constants & enums
│   ├── database/     # Prisma schema & migrations
│   ├── types/        # Shared TypeScript data models
│   ├── ui/           # Shared UI component library
│   ├── utils/        # Common utility helpers
│   └── validation/   # Input validation schemas
├── docker-compose.yml# Local database setup
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
* **Node.js**: `v18.x` or higher
* **pnpm**: `v9.x` or higher (`npm install -g pnpm`)
* **Docker** (optional, for running local PostgreSQL)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone git@github.com:ralph-web-dev/ministry-hub.git
cd ministry-hub
pnpm install
```

### 2. Database Setup
Generate and push database migrations:
```bash
# Push schema to database
pnpm --filter @ministryhub/database prisma db push

# (Optional) Seed initial data
pnpm --filter @ministryhub/database seed
```

### 3. Development
Start the application services in development mode:
```bash
pnpm dev
```
* **Web Application**: `http://localhost:5173`
* **API Server**: `http://localhost:3000`

---

## AWS Deployment (Production / Testing)

### Option 1: Single-Instance Deployment (AWS Lightsail or EC2)

1. **Launch an AWS Instance**:
   * Create an **Ubuntu 22.04 LTS** instance on AWS Lightsail or EC2.
   * Open Ports `80` (HTTP), `443` (HTTPS), and `22` (SSH) in the instance firewall / Security Group.

2. **Connect and Install Docker**:
   ```bash
   ssh ubuntu@<YOUR_INSTANCE_PUBLIC_IP>

   # Install Docker and Docker Compose plugin
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Clone & Run MinistryHub**:
   ```bash
   git clone https://github.com/ralph-web-dev/ministry-hub.git
   cd ministry-hub

   # Start all production containers
   docker compose -f docker-compose.prod.yml up -d --build

   # Run Database Migrations & Initial Seed
   docker compose -f docker-compose.prod.yml exec api pnpm --filter @ministryhub/database prisma db push
   docker compose -f docker-compose.prod.yml exec api pnpm --filter @ministryhub/database seed
   ```

4. **Access the Application**:
   * Open `http://<YOUR_INSTANCE_PUBLIC_IP>` in your browser.

---

## License
Proprietary and confidential. All rights reserved.
