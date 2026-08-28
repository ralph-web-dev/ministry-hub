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

## License
Proprietary and confidential. All rights reserved.
