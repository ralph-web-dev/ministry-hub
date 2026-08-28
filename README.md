# MinistryHub ⛪

A modern, comprehensive church management and member directory platform designed to empower ministry leaders, streamline administrative workflows, and nurture church community engagement.

---

## 🚀 Tech Stack

### Frontend (`apps/web`)
* **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Routing**: [React Router v6](https://reactrouter.com/)
* **Styling**: Vanilla SCSS with custom design token system
* **Icons**: [@tabler/icons-react](https://tabler.io/icons)
* **HTTP Client**: [Axios](https://axios-http.com/)

### Backend (`apps/api`)
* **Framework**: [NestJS](https://nestjs.com/) + [TypeScript](https://www.typescriptlang.org/)
* **ORM**: [Prisma ORM](https://www.prisma.io/)
* **Database**: PostgreSQL (via Docker) / SQLite
* **Authentication**: JWT Strategy + Passport
* **File Storage**: Local Multipart Uploads

### Monorepo & Shared Packages
* **Workspace Manager**: [pnpm](https://pnpm.io/) + [Turborepo](https://turbo.build/)
* **Shared Packages**:
  * `@ministryhub/database`: Prisma schema, client, and seeders
  * `@ministryhub/types`: Shared TypeScript data models
  * `@ministryhub/validation`: Shared validation schemas
  * `@ministryhub/auth`, `@ministryhub/constants`, `@ministryhub/ui`, `@ministryhub/utils`

---

## 📦 Project Structure

```text
ministryhub/
├── apps/
│   ├── api/          # NestJS Backend API
│   └── web/          # React + Vite Web Application
├── packages/
│   ├── auth/         # Shared auth utilities
│   ├── constants/    # Global constants & enums
│   ├── database/     # Prisma schema & migrations
│   ├── types/        # Shared TypeScript interfaces
│   ├── ui/           # Shared UI component library
│   ├── utils/        # Common utility helpers
│   └── validation/   # Input validation schemas
├── docker-compose.yml# Local database setup
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 🛠️ Getting Started

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
Initialize and migrate the database:
```bash
# Push schema to database
pnpm --filter @ministryhub/database prisma db push

# (Optional) Seed initial data
pnpm --filter @ministryhub/database seed
```

### 3. Running in Development
Start all applications concurrently:
```bash
pnpm dev
```
* **Web Application**: `http://localhost:5173`
* **API Server**: `http://localhost:3000`

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
