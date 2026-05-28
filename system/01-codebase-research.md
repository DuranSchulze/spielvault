# RepFlow — Codebase Research & Analysis

> **Date:** 2026-05-23
> **Author:** Zed Analysis Agent
> **Scope:** Full codebase scan of `repflow/`

---

## 1. Product Identity

**RepFlow** is a centralized, department-based **spiel management platform** for teams. A "spiel" is a reusable block of formatted text used for support responses, sales scripts, internal messaging, outreach, or any repeated written workflow.

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui + `tw-animate-css` |
| Auth | Better Auth (email/password, self-registration disabled) |
| Database | PostgreSQL via Prisma ORM v7 |
| Rich Text | Tiptap v3 (StarterKit + extensions) |
| UI Components | Base UI React, Lucide icons, Framer Motion |
| Toast | `goey-toast` |
| Hosting | Vercel (target) |

### Product Hierarchy (Data Model)

```
Company
  └── Department (scoped to company)
        ├── Employee ⟷ UserDepartment (many-to-many pivot)
        └── Spiel (scoped to department)
              └── Category (scoped to company, optional on Spiel)
```

### Roles

| Role | Level | Scope |
|---|---|---|
| `super_admin` | 3 | Full platform access |
| `admin` | 2 | Manages assigned departments, users, spiels, categories |
| `employee` | 1 | Views and uses spiels from assigned departments |

---

## 2. File Map & Architecture

```
repflow/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth group (login, signup)
│   │   ├── layout.tsx            # Brand panel + form panel
│   │   ├── login/page.tsx        # Login page shell
│   │   ├── login/login-form.tsx  # Client login form
│   │   └── signup/page.tsx       # "Disabled" placeholder
│   ├── (dashboard)/              # Protected dashboard group
│   │   ├── layout.tsx            # Dashboard shell wrapper
│   │   ├── dashboard/page.tsx    # Overview with stats
│   │   ├── spiels/page.tsx       # Library with filter chips
│   │   ├── spiels/new/           # New spiel form (editor + vars)
│   │   ├── spiels/[id]/page.tsx  # Detail placeholder
│   │   ├── categories/page.tsx   # Placeholder page
│   │   ├── departments/          # Departments page + manager
│   │   ├── users/page.tsx        # Placeholder page
│   │   ├── companies/page.tsx    # Placeholder page
│   │   ├── archive/page.tsx      # Archived spiels list
│   │   └── profile/              # Profile + password change
│   ├── api/                      # Route Handlers
│   │   ├── auth/[...all]/        # Better Auth catch-all
│   │   ├── spiels/               # POST (create), [id] PATCH/DELETE
│   │   ├── departments/          # POST, [id] PATCH/DELETE
│   │   ├── categories/           # POST, [id] PATCH/DELETE
│   │   └── variables/            # GET, POST, [id] PATCH/DELETE
│   ├── layout.tsx                # Root layout (fonts, theme, toast)
│   ├── page.tsx                  # Root → redirect /login
│   └── globals.css               # Tailwind v4 + design tokens + editor styles
├── components/
│   ├── layout/
│   │   ├── dashboard-shell.tsx   # Sidebar + main layout (async)
│   │   ├── sidebar-nav.tsx       # Client nav with active state
│   │   ├── account-actions.tsx   # User dropdown (sign out, theme)
│   │   └── page-header.tsx       # Reusable page heading
│   ├── spiels/
│   │   ├── spiel-list.tsx        # List with archive/delete actions
│   │   └── spiel-card.tsx        # Card with copy, edit, action
│   ├── editor/
│   │   ├── spiel-editor.tsx      # Tiptap editor + toolbar + tokens
│   │   └── variable-panel.tsx    # Sidebar variable CRUD + insert
│   ├── ui/
│   │   ├── button.tsx            # shadcn Button (Base UI)
│   │   ├── goey-toaster.tsx      # Toast re-export
│   │   └── theme-toggle.tsx      # Dark/light toggle
│   └── theme-provider.tsx        # next-themes wrapper
├── lib/
│   ├── auth/
│   │   ├── auth.ts               # Better Auth server config
│   │   ├── auth-client.ts        # Better Auth browser client
│   │   ├── proxy.ts              # Session cookie checker (NOT middleware)
│   │   └── session.ts            # getServerSession, requireAccessContext, etc.
│   ├── permissions/
│   │   └── index.ts              # Role-based gate helpers
│   ├── prisma/
│   │   └── client.ts             # Singleton Prisma client + Accelerate
│   └── utils/
│       ├── index.ts              # slugify, truncate, formatDate
│       └── utils.ts              # cn() helper (clsx + tailwind-merge)
├── server/services/
│   ├── spiel.service.ts          # Spiel data access (mostly unused)
│   └── user.service.ts           # User data access (mostly unused)
├── types/
│   └── index.ts                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma             # Full schema (Better Auth + business models)
│   └── seed.ts                   # Admin + company + departments + categories
├── docs/                         # PRD, PLAN, TECHNICAL, DESIGN
`proxy.ts`                      # Next.js 16 middleware (new convention)
├── next.config.ts
├── prisma.config.ts
├── components.json               # shadcn config
└── package.json
```

---

## 3. Data Model (Prisma Schema)

### Better Auth Models (auto-managed)
- **User** — Extended with `role`, `isActive`, `companyId`
- **Session** — Tracks sessions
- **Account** — Stores password hash, OAuth tokens
- **Verification** — Email verification codes

### Custom Business Models

| Model | Key Fields | Relations |
|---|---|---|
| **Company** | `id, name, slug (unique)` | users, departments, categories, spiels, spielVariables |
| **Department** | `id, companyId, name, slug` | company, members (UserDepartment), spiels; `@@unique([companyId, slug])` |
| **UserDepartment** | `id, userId, departmentId` | user, department; `@@unique([userId, departmentId])` |
| **Category** | `id, companyId, name, slug` | company, spiels; `@@unique([companyId, slug])` |
| **Spiel** | `id, companyId, departmentId, categoryId?, createdByUserId, title, contentJson?, contentHtml?, contentPlain?, status ("active" \| "archived")` | company, department, category, createdBy (User) |
| **SpielVariable** | `id, companyId, key, value` | company; `@@unique([companyId, key])` |
| **AuditLog** | `id, userId, action, entityType, entityId, metadata (Json?)` | user |

### Data Storage Strategy
Each spiel stores content in **three formats**:
- `contentJson` — Tiptap JSON for safe editing
- `contentHtml` — HTML for rich copy/paste
- `contentPlain` — Plain text for search, fallback

---

## 4. Built Features vs Roadmap

### ✅ Implemented (Phase 1)
- Email/password authentication (via Better Auth)
- Protected routes (server-side redirect in shell, proxy.ts attempted)
- Company structure (seed creates FilePino)
- Department CRUD (via Departments page + API)
- Category management (via modal in new spiel form + API)
- Spiel creation (rich text editor, variables, copy)
- Spiel listing + department/category filters
- Spiel archive/delete
- Rich text editor (bold, italic, underline, headings, lists, blockquote, links, HR)
- Placeholder tokens `[TokenName]` with variable panel
- Copy spiel (rich + plain text)
- Profile page (name, password change)
- Archive view with filters
- Role-based permission system (basic)

### 🚧 Partially Built / Placeholder
- **Spiel detail view** (`/spiels/[id]`) — static placeholder, links to non-existent `/edit`
- **Categories page** (`/categories`) — static "No categories yet" placeholder
- **Users page** (`/users`) — static "No users yet" placeholder
- **Company settings** (`/companies`) — static "Coming soon" placeholder
- **Dashboard stats** — shows counts, but no charts or recent activity
- **AuditLog model** exists in schema but no UI or API routes

### ❌ Not Yet Built (Future Phases)
- Edit spiel (no route for `/spiels/[id]/edit`)
- Full-text search by title/content
- User invitation/management (CRUD)
- Favorites / pinned spiels
- Activity logs UI
- Browser extension
- Version history
- Approval workflows
- Import/export
- Analytics
- Pagination on spiel lists

---

## 5. Identified Issues & Errors

### 🔴 Critical Issues

#### 1. Edit spiel page links to non-existent route
- **File:** `app/(dashboard)/spiels/[id]/page.tsx` (line 21 — `/spiels/${params.id}/edit`)
- **Problem:** The spiel detail page has an "Edit" button linking to `/spiels/${params.id}/edit`, but no `app/(dashboard)/spiels/[id]/edit/` route exists. This causes a 404 error.
- **Impact:** Users cannot edit spiels after creation. This breaks a core CRUD requirement.

#### 2. No GET handler for `api/spiels/[id]`
- **File:** `app/api/spiels/[id]/route.ts`
- **Problem:** Only `PATCH` and `DELETE` are exported. No `GET` to fetch spiel detail data. The front-end detail page has no way to fetch the actual spiel content.

#### 3. `PATCH /api/spiels/[id]` only archives — no content update
- **File:** `app/api/spiels/[id]/route.ts`
- **Problem:** The PATCH handler hardcodes `{ status: "archived" }`. There's no endpoint to update title, content, department, or category. Combined with issue #1, spiels are effectively write-once.

### 🟡 Medium Issues

#### 4. No pagination on spiel lists
- **Files:** `spiels/page.tsx`, `archive/page.tsx`, `components/spiels/spiel-list.tsx`
- **Problem:** Spiel queries use `findMany()` with no `take`/`skip`. As the database grows, these pages will fetch ALL active (or archived) spiels, causing performance degradation.

#### 5. Inefficient query pattern in library page
- **File:** `app/(dashboard)/spiels/page.tsx`
- **Problem:** The query fetches department and category data for filtering separately from the spiel query, then casts them to `FilterOption[]`. This adds unnecessary type complexity and an extra DB query.

#### 6. `user.service.ts` and `spiel.service.ts` are mostly unused
- **Files:** `server/services/*.service.ts`
- **Problem:** These service functions exist but are not imported by any route handler or page. The actual data access is done inline in route handlers. This is dead code that creates confusion about architectural intent.

#### 7. Missing `.env.example` file
- **Problem:** README says "Copy `.env.example .env`" but no `.env.example` exists. New developers don't know which environment variables are required.

#### 8. `categories/page.tsx` is a static placeholder
- **File:** `app/(dashboard)/categories/page.tsx`
- **Problem:** The PRD requires category CRUD from a dedicated page, but only the "New Spiel" form has a category manager modal. The dedicated page is empty.

#### 9. `users/page.tsx` is a static placeholder
- **File:** `app/(dashboard)/users/page.tsx`
- **Problem:** No user management UI exists. The "Invite User" button is non-functional.

### 🟢 Minor Issues / Inconsistencies

#### 10. `seed.ts` — Account upsert uses custom `id` pattern
- **File:** `prisma/seed.ts`
- **Problem:** Uses `where: { id: "${adminUser.id}-credential" }` for the Account upsert. While this works on initial seed and re-runs, it couples the Account ID to the User ID format, which may conflict if Better Auth manages Account IDs differently in future versions.

#### 11. `app/page.tsx` redirects to `/login` but root could be a landing page
- **File:** `app/page.tsx`
- **Problem:** Hard redirect to `/login` with no interstitial. The root URL (`/`) gives no context before redirecting.

#### 12. No server-side validation library
- **Problem:** All validation is manual (trimming, checking for emptiness). No Zod, Valibot, or similar validation library is used, increasing risk of inconsistent validation and boilerplate.

#### 13. `PATCH /api/spiels/[id]` missing permission check
- **File:** `app/api/spiels/[id]/route.ts`
- **Problem:** The route checks if the user has department access but does NOT verify if the user has `admin` role (via `canManageSpiels` or similar). Any employee with access to a department's spiels can archive them.

#### 14. `DELETE /api/departments/[id]` returns 204 but no body
- **File:** `app/api/departments/[id]/route.ts`
- **Problem:** `new NextResponse(null, { status: 204 })` — The front-end `DepartmentsManager` doesn't check status code expectations here (it checks `!response.ok` which would be false for 204, so this works, but it's inconsistent).

#### 15. `eslint.config.mjs` — Not reviewed, but Next.js ESLint config may have version mismatches
- **Problem:** Package depends on `eslint-config-next@16.2.0` which matches Next.js version. But ESLint v9 has breaking changes in flat config format which may conflict.

---

## 6. Enhancement Opportunities

### Architectural Improvements

| Area | Opportunity |
|---|---|
| **Middleware** | ✅ Already correct — `proxy.ts` is the Next.js 16 convention |
| **Server Services** | Either use `spiel.service.ts`/`user.service.ts` in route handlers, or remove them |
| **Validation** | Add Zod for API request validation and type generation |
| **Pagination** | Add cursor-based or offset pagination to spiel lists |
| **Search** | Add full-text search across title + `contentPlain` using Prisma `contains` or PostgreSQL `tsvector` |

### Missing Features (Phase 1.1)

| Feature | Priority | Notes |
|---|---|---|
| Edit spiel page | High | Core CRUD requirement, broken UX |
| User management | High | No way to add/remove users |
| `.env.example` | High | Blocks onboarding |
| Search by text | Medium | PRD requirement, only filter exists |
| Categories page | Medium | Management UX inconsistent |
| Company settings | Medium | No way to update company info |

### UX / Polish

| Area | Suggestion |
|---|---|
| Loading states | Several components lack skeleton/suspense boundaries |
| Error boundaries | No granular error boundaries per page/component |
| Empty states | Some pages have empty state, but they're inconsistent |
| Confirm dialogs | Uses `window.confirm()` — should use a proper modal |
| Keyboard shortcuts | Editor has them, but list/save actions don't mention them |
| Mobile responsiveness | Dashboard shell with 260px sidebar may break on small screens |

### Testing & Quality

| Area | Status |
|---|---|
| Unit tests | None found |
| Integration tests | None found |
| E2E tests | None found |
| TypeScript strict | `strict: true` in tsconfig ✅ |
| Linting | ESLint configured ✅ |

---

## 7. Routes Summary

### Public Routes
| Path | Auth Required | Status |
|---|---|---|
| `/login` | No (redirect if authed) | ✅ Working |
| `/signup` | No | ✅ Shows disabled message |
| `/` | No | ✅ Redirects to `/login` |

### Protected Routes
| Path | Status | Notes |
|---|---|---|
| `/dashboard` | ✅ Working | Overview with counts |
| `/spiels` | ✅ Working | Library with filters |
| `/spiels/new` | ✅ Working | Rich editor + variables panel |
| `/spiels/[id]` | ⚠️ Placeholder | No data fetching, broken edit link |
| `/spiels/[id]/edit` | ❌ Missing | 404 error |
| `/categories` | ⚠️ Placeholder | No actual management |
| `/departments` | ✅ Working | Full CRUD |
| `/users` | ⚠️ Placeholder | No functionality |
| `/companies` | ⚠️ Placeholder | "Coming soon" |
| `/archive` | ✅ Working | Archived spiel list |
| `/profile` | ✅ Working | Profile + password change |

### API Routes
| Method | Path | Status | Notes |
|---|---|---|---|
| GET/POST | `/api/auth/[...all]` | ✅ Working | Better Auth catch-all |
| POST | `/api/spiels` | ✅ Working | Create spiel |
| PATCH | `/api/spiels/[id]` | ⚠️ Archive only | No content update |
| DELETE | `/api/spiels/[id]` | ✅ Working | Delete archived |
| POST | `/api/departments` | ✅ Working | Create department |
| PATCH | `/api/departments/[id]` | ✅ Working | Update department |
| DELETE | `/api/departments/[id]` | ✅ Working | Delete department (no spiels) |
| POST | `/api/categories` | ✅ Working | Create category |
| PATCH | `/api/categories/[id]` | ✅ Working | Update category |
| DELETE | `/api/categories/[id]` | ✅ Working | Delete + nullify spiels |
| GET | `/api/variables` | ✅ Working | List variables |
| POST | `/api/variables` | ✅ Working | Create variable |
| PATCH | `/api/variables/[id]` | ✅ Working | Update variable |
| DELETE | `/api/variables/[id]` | ✅ Working | Delete variable |

---

## 8. Security Analysis

| Concern | Assessment |
|---|---|
| **Route protection** | ✅ Middleware via `proxy.ts` (Next.js 16 convention), plus server component `requireServerSession` checks. |
| **API auth** | ✅ All API routes check `getAccessContextOrNull()` |
| **Cross-company isolation** | ✅ Queries filter by `companyId` |
| **Department isolation** | ✅ Spiel queries filter by user's `departmentIds` |
| **Password storage** | ✅ Better Auth handles hashing |
| **Role enforcement** | ⚠️ Inconsistent — some routes check `canManageDepartment`, others don't check roles at all |
| **Input sanitization** | ⚠️ No explicit HTML sanitization on rich text input (XSS risk when rendering) |
| **SQL injection** | ✅ Prisma parameterized queries |

---

## 9. Dependency Audit

| Package | Version | Notes |
|---|---|---|
| `next` | 16.2.0 | Cutting edge — may have breaking changes per AGENTS.md |
| `react` | 19.2.4 | Latest React 19 |
| `better-auth` | ^1.5.5 | Relatively new auth library |
| `@prisma/client` | ^7.5.0 | Latest Prisma v7 |
| `@tiptap/react` | ^3.20.4 | Latest Tiptap v3 |
| `tailwindcss` | ^4.2.2 | Latest Tailwind v4 |
| `@base-ui/react` | ^1.3.0 | Relatively new headless UI library |

**Unused dependencies detected:**
- `framer-motion` — Installed but not imported anywhere in the codebase
- `postcss` — Listed as dependency but also in devDependencies; PostCSS config exists

---

## 10. Conclusion & Recommendations

### Immediate Fixes Needed
1. **Create edit spiel route** — `/spiels/[id]/edit` with pre-filled editor
2. **Add `GET /api/spiels/[id]`** — To fetch spiel detail data
3. **Extend `PATCH /api/spiels/[id]`** — To support content/title updates
4. **Create `.env.example` file** — Document required env vars

### High-Value Enhancements
6. Add full-text search input on spiel library page
7. Add pagination to spiel lists (`take`/`skip`)
8. Implement user management page (at minimum, list users)
9. Implement categories management page
10. Add Zod for request validation

### Technical Debt
11. Remove dead code (`server/services/` if unused, `framer-motion` if unused)
12. Add consistent role checking across all API routes
13. Migrate inline DB queries into service layer (or remove service files)
