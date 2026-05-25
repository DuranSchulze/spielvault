# Plan 12 — Fix Seed Account ID Coupling

> **Priority:** 🟢 Minor
> **Checklist Ref:** `CHECKLIST.md` → #12

---

## What

Refactor the seed script's Account creation to avoid coupling the Account ID to the User ID format.

## Current Problem

```ts
await prisma.account.upsert({
  where: { id: `${adminUser.id}-credential` },
  // ...
  create: {
    id: `${adminUser.id}-credential`,  // Couples Account ID to User ID
    accountId: adminUser.id,
    providerId: "credential",
    userId: adminUser.id,
    password: passwordHash,
  },
});
```

The Account ID uses the pattern `${adminUser.id}-credential`. While this works on initial seed and re-runs, it couples the Account primary key to the User ID naming convention. If Better Auth changes how it generates or references Account IDs, this will break.

## Requirements

- [ ] Use a CUID or let Prisma auto-generate the Account ID
- [ ] Use a proper unique constraint to find existing accounts for upsert
- [ ] The Account model has `@@unique` on `providerId` + `userId`? No — it doesn't. We need to use `findFirst` + `create`/`update` pattern instead.

## Implementation

```ts
// Find existing account by providerId + userId
const existingAccount = await prisma.account.findFirst({
  where: {
    providerId: "credential",
    userId: adminUser.id,
  },
});

if (existingAccount) {
  await prisma.account.update({
    where: { id: existingAccount.id },
    data: { password: passwordHash },
  });
} else {
  await prisma.account.create({
    data: {
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: passwordHash,
    },
  });
}
```

## Files Affected

| File | Change |
|---|---|
| `prisma/seed.ts` | **Modify** — Replace `upsert` with `findFirst` + create/update |

## Dependencies

None.

## Acceptance Criteria

- [ ] Running `npm run db:seed` on a fresh database creates the admin account
- [ ] Running `npm run db:seed` again updates the existing account
- [ ] The Account ID is a CUID (auto-generated), not a formatted string
