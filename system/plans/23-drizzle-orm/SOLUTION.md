# Solution: Migrate Prisma → Drizzle ORM

## What was implemented

Full replacement of Prisma 7.5.0 with Drizzle ORM across all 40+ files that previously imported from `@/lib/prisma/client`.

## Key files created

### Infrastructure
- `lib/drizzle/db.ts` — singleton `db` instance using `drizzle-orm/node-postgres` + `pg` Pool
- `drizzle.config.ts` — Drizzle Kit config pointing at `lib/drizzle/schema/index.ts`

### Schema (9 files)
- `lib/drizzle/schema/auth.ts` — `users`, `sessions`, `accounts`, `verifications`
- `lib/drizzle/schema/company.ts` — `companies`
- `lib/drizzle/schema/department.ts` — `departments`, `userDepartments`
- `lib/drizzle/schema/category.ts` — `categories`
- `lib/drizzle/schema/spiel.ts` — `spiels`, `spielVersions`, `spielApprovals`
- `lib/drizzle/schema/variable.ts` — `spielVariables`
- `lib/drizzle/schema/favorite.ts` — `userSpielFavorites`
- `lib/drizzle/schema/token.ts` — `apiTokens`
- `lib/drizzle/schema/audit.ts` — `auditLogs`
- `lib/drizzle/schema/index.ts` — barrel re-export

## Key files modified

### Auth
- `lib/auth/auth.ts` — `prismaAdapter` → `drizzleAdapter` with explicit schema mapping

### Library utilities
- `lib/audit/log-activity.ts` — `db.insert(auditLogs).values()`
- `lib/versioning/snapshot-spiel.ts` — `db.insert(spielVersions).values()`
- `lib/auth/bearer-auth.ts` — two sequential `db.select()` queries
- `lib/auth/session.ts` — `db.select().from(userDepartments).where()`

### All API routes and server components — see plan README for full list

### Seed
- `prisma/seed.ts` — rewritten with Drizzle (upsert via select+insert/update)

## Files deleted
- `lib/prisma/client.ts`
- `prisma.config.ts`

## Packages removed
- `@prisma/client`, `prisma`, `@prisma/adapter-pg`

## Deviations from plan

- `drizzle-orm` moved to `dependencies` (was in `devDependencies` initially) — it's a runtime dep
- `postinstall: "prisma generate"` removed from `package.json`
- `prisma.seed` key removed from `package.json`
- `server/services/spiel.service.ts` and `user.service.ts` were not in original plan scope but also used Prisma — both rewritten

## Key translation patterns used

| Prisma | Drizzle |
|---|---|
| `findFirst`/`findUnique` | `.select().from().where().limit(1).then(r => r[0] ?? null)` |
| `include: { department: {...} }` | `.leftJoin(departments, eq(...))` |
| `$transaction([...])` | `db.transaction(async tx => {})` |
| `upsert` with empty update | `.insert().values().onConflictDoNothing()` |
| `groupBy` with `_count._all` | `.select({ count: count() }).groupBy()` |
| `_count: { select: {...} }` | Separate `count()` queries, merge in JS |
| `favoritedBy: { some: { userId } }` | Pre-fetch favorite IDs, then `inArray(spiels.id, ids)` |

## Decisions made

- **Two-query pattern** for nested includes with many-to-many (users+departments): fetch parent rows first, then junction rows, merge in JS using a Map
- **`$inferInsert` typing**: Used `Partial<typeof table.$inferInsert>` instead of `Parameters<...>[0]` for dynamic update objects
- **`db.selectDistinct()`** used for active user count in analytics (not a named export from drizzle-orm)
- **Favorites filter**: Pre-fetch user's favorites as array of IDs before building the main spiels where clause

## DB schema validation

Run `npx drizzle-kit push` interactively to apply the one pending diff (adding `session_token_unique` unique constraint to the session table — Prisma enforced this at app level only).
