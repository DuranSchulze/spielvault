# Plan 23 — Migrate from Prisma to Drizzle ORM

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #23

---

## What

Replace Prisma ORM with Drizzle ORM as the database access layer. This involves swapping out `@prisma/client`, Prisma schema files, and all database queries for Drizzle's type-safe schema + query builder approach.

## Why

- **Lighter dependency footprint** — Drizzle is a thin query builder layer over the driver, with no large client binary or code generation overhead.
- **Faster builds** — No Prisma `generate` step, which runs on every `npm install`/build.
- **Better Neon integration** — Drizzle has first-class support for Neon's serverless HTTP driver, WebSocket driver, and node-postgres. It works seamlessly with Neon branching.
- **More control** — Raw SQL access when needed, no magic. The schema is defined in TypeScript and maps directly to your database.
- **Smaller bundle** — For edge/serverless environments, Drizzle's negligible size matters.

## Requirements

- [ ] Install Drizzle ORM (`drizzle-orm`, `drizzle-kit`) and select a driver (`@neondatabase/serverless`, `pg`, or `postgres`)
- [ ] Create `drizzle.config.ts` with schema path, migration output, and PostgreSQL dialect
- [ ] Create `lib/drizzle/db.ts` — Initialize the Drizzle client with the chosen driver
- [ ] Convert Prisma schema to Drizzle schema files in `lib/drizzle/schema/`
- [ ] Generate initial migration from the new Drizzle schema
- [ ] Replace all `prisma` imports across the codebase with Drizzle `db` imports
- [ ] Update all query patterns (`findMany` → `db.select().from()`, `create` → `db.insert()`, etc.)
- [ ] Remove Prisma dependencies (`@prisma/client`, `prisma`, `@prisma/adapter-pg`, `@prisma/extension-accelerate`)
- [ ] Remove Prisma config files (`prisma/schema.prisma`, `prisma.config.ts`)
- [ ] Update `package.json` scripts (`postinstall`, `db:seed`)
- [ ] Update the seed script to use Drizzle instead of Prisma
- [ ] Remove Prisma migrate commands from CI/CD and dev workflows
- [ ] Run the full test suite and verify all CRUD operations work

## Driver Selection

The project already uses `pg` as its database driver (via `@prisma/adapter-pg`). The recommended driver for a Next.js App Router project is:

| Driver | Best for |
|---|---|
| `@neondatabase/serverless` (HTTP) | Serverless/edge environments (Vercel, Netlify) — uses HTTP fetch |
| `@neondatabase/serverless` (WebSocket) | Long-running Node.js servers, local dev — persistent connection pool |
| `pg` (node-postgres) | Classic Node.js — most stable, widely used |

Given this project currently uses `pg` through Prisma, **node-postgres (`pg`)** is the most straightforward migration path since `pg` is already a dependency. Alternatively, **`@neondatabase/serverless` (HTTP)** would be better for edge/serverless deployment.

## Approach

1. **Install Drizzle packages** — `drizzle-orm`, `drizzle-kit`, and the chosen driver
2. **Create configuration** — `drizzle.config.ts` pointing at `./lib/drizzle/schema/` with PostgreSQL dialect
3. **Write schema files** — Convert `prisma/schema.prisma` models to Drizzle `pgTable` definitions
   - Maps: models → `pgTable()`, enums → `pgEnum()`, relations → `relations()` from `drizzle-orm`
   - Includes all indexes, unique constraints, default values, and relations
4. **Create the DB client** — `lib/drizzle/db.ts` initializes the Drizzle instance with the driver pool
5. **Generate migration** — `npx drizzle-kit generate` to produce the initial SQL migration
6. **Apply migration** — `npx drizzle-kit migrate` to apply to the database
7. **Rewrite queries** — Replace all Prisma query patterns with Drizzle equivalents across:
   - API route handlers (all `app/api/**/route.ts` files)
   - Server components and server actions
   - Seed script
   - Any library utilities that use Prisma directly
8. **Remove Prisma** — Uninstall Prisma packages, delete config files, update `package.json` scripts
9. **Test comprehensively** — Run the app, exercise all CRUD paths, verify no regressions

## Query Pattern Migration Reference

| Prisma | Drizzle |
|---|---|
| `prisma.spiel.findMany({ where: {...}, include: {...}, orderBy: {...} })` | `db.select().from(spiels).where(...).leftJoin(...).orderBy(...)` |
| `prisma.spiel.findFirst({ where: { id, companyId } })` | `db.select().from(spiels).where(and(eq(spiels.id, id), eq(spiels.companyId, companyId))).limit(1)` |
| `prisma.spiel.create({ data: {...} })` | `db.insert(spiels).values({...}).returning()` |
| `prisma.spiel.update({ where: { id }, data: {...} })` | `db.update(spiels).set({...}).where(eq(spiels.id, id)).returning()` |
| `prisma.spiel.delete({ where: { id } })` | `db.delete(spiels).where(eq(spiels.id, id))` |
| `prisma.$transaction([...])` | `db.transaction(async (tx) => {...})` |
| `prisma.user.findUnique({ where: { email } })` | `db.select().from(users).where(eq(users.email, email)).limit(1)` |
| `prisma.$count()` / `count: true` | `db.select({ count: count() }).from(spiels).where(...)` |

## Files Affected (Estimated)

| File | Change |
|---|---|
| `package.json` | **Modify** — Swap Prisma deps for Drizzle deps |
| `prisma.config.ts` | **Delete** — No longer needed |
| `prisma/schema.prisma` | **Delete** — Replaced by Drizzle schema files |
| `drizzle.config.ts` | **Create** — Drizzle Kit configuration |
| `lib/drizzle/db.ts` | **Create** — Drizzle client initialization |
| `lib/drizzle/schema/*.ts` | **Create** — Drizzle schema definitions (~10 files) |
| `lib/prisma/client.ts` | **Delete** — Replaced by `lib/drizzle/db.ts` |
| `lib/prisma/*` | **Delete** — Prisma utilities |
| All route handlers | **Modify** — Replace Prisma queries with Drizzle |
| `prisma/seed.ts` | **Modify** — Rewrite to use Drizzle |
| `prisma/migrations/` | **Delete** — Replaced by `drizzle/` migrations |
| Various server components | **Modify** — Update query imports |

## Dependencies

- Will install: `drizzle-orm`, `drizzle-kit`
- Will uninstall: `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `@prisma/extension-accelerate`
- Unchanged: `pg` (reused with Drizzle's node-postgres driver)

## Relationship to Other Plans

**This plan should be completed before Plan #24 (Neon Auth with Better Auth).** The Neon Auth migration may simplify some auth-related database operations, but having Drizzle as the ORM first ensures a consistent data access layer before touching auth logic.

## Acceptance Criteria

- [ ] `npm install` completes without Prisma packages
- [ ] No `@prisma/client`, `prisma` imports remain anywhere in the codebase
- [ ] All API routes return correct responses for CRUD operations
- [ ] Seed script populates the database correctly
- [ ] All existing features (spiel CRUD, categories, departments, users, variables) work identically
- [ ] Migrations can be generated and applied with `npx drizzle-kit`
- [ ] Build succeeds with zero errors
