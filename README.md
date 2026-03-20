# Spiel Vault

A centralized, department-based spiel management platform for teams. Store, organize, search, and reuse formatted communication blocks (spiels) across your company — with a future browser extension for in-context insertion.

---

## What is a Spiel?

A spiel is a reusable block of formatted text used for support responses, sales scripts, internal messaging, outreach, or any repeated written workflow.

---

## Stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling   | Tailwind CSS v4 + shadcn/ui          |
| Auth      | Better Auth (email/password)         |
| Database  | PostgreSQL via Prisma ORM            |
| Rich Text | Tiptap                               |
| Hosting   | Vercel                               |

---

## Documentation

All product and technical documents are in the [`docs/`](./docs/) folder:

- [`docs/PRD.md`](./docs/PRD.md) — Product Requirements Document
- [`docs/PLAN.md`](./docs/PLAN.md) — Product Plan & Phase Roadmap
- [`docs/TECHNICAL.md`](./docs/TECHNICAL.md) — Technical Architecture
- [`docs/DESIGN.md`](./docs/DESIGN.md) — Design System Strategy

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Fill in your DATABASE_URL and BETTER_AUTH_SECRET in .env

# 4. Push Prisma schema to database
npx prisma db push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Product Hierarchy

```
Company
  └── Department
        ├── Employees (many-to-many)
        └── Spiels
              └── Category
```

- A user belongs to one company but can be in multiple departments
- Spiels are scoped to a department; users only see spiels from their departments
- Categories organize spiels within a department

---

## Roles

| Role            | Access                                                  |
| --------------- | ------------------------------------------------------- |
| Super Admin     | Full platform access                                    |
| Admin / Manager | Manages assigned departments, users, spiels, categories |
| Employee        | Views and uses spiels from assigned departments         |

---

## Phase Roadmap

- **Phase 1 (Current)** — Auth, company/department structure, spiel CRUD, rich text editor, search & filter
- **Phase 2** — Browser extension popup, quick copy/insert
- **Phase 3** — Favorites, pinned spiels, activity logs, archive flows
- **Phase 4** — Version history, approvals, analytics, import/export
