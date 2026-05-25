# Plan 02 — Add GET Handler for Spiel Detail

> **Priority:** 🔴 Critical
> **Checklist Ref:** `CHECKLIST.md` → #2

---

## What

Add a `GET` export to `app/api/spiels/[id]/route.ts` so the front-end can fetch individual spiel data with its relations (department, category, creator).

## Why

The route file only exports `PATCH` and `DELETE`. There's no way to fetch a single spiel's complete data from the API. The detail page (`/spiels/[id]`) and the future edit page (Plan 01) both need this.

## Current State

```ts
// app/api/spiels/[id]/route.ts currently exports:
export async function PATCH(...)   // archive only
export async function DELETE(...)  // delete archived only
// Missing:
// export async function GET(...)  // fetch spiel data
```

## Requirements

- [ ] Export a `GET` async function that accepts `req` and `{ params }`
- [ ] Validates user is authenticated via `getAccessContextOrNull()`
- [ ] Fetches the spiel with `include: { department, category, createdBy }`
- [ ] Validates the user has access to the spiel's department
- [ ] Returns 404 if spiel not found in the user's company
- [ ] Returns 403 if user doesn't have department access

## Implementation

```ts
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const spiel = await prisma.spiel.findFirst({
    where: { id, companyId: access.companyId },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(spiel);
}
```

## Files Affected

| File | Change |
|---|---|
| `app/api/spiels/[id]/route.ts` | **Modify** — Add `GET` export |

## Dependencies

None.

## Acceptance Criteria

- [ ] `GET /api/spiels/:id` returns the full spiel with department, category, creator
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 404 for spiels outside the user's company
- [ ] Returns 403 for spiels in departments the user doesn't belong to
- [ ] Returns 200 with data for valid requests
