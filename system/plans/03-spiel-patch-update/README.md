# Plan 03 — Extend PATCH for Content Updates

> **Priority:** 🔴 Critical
> **Checklist Ref:** `CHECKLIST.md` → #3

---

## What

Extend the existing `PATCH /api/spiels/[id]` handler to accept optional fields — `title`, `contentHtml`, `contentJson`, `contentPlain`, `categoryId` — and dynamically build the update payload instead of hardcoding `{ status: "archived" }`.

## Why

The current PATCH handler only supports archiving (`{ status: "archived" }`). Combined with the missing edit route (Plan 01), spiels are write-once. Users need to update spiel content after creation.

## Current State

```ts
// Current PATCH — hardcoded archive only
export async function PATCH(...) {
  const updated = await prisma.spiel.update({
    where: { id },
    data: { status: "archived" },
  });
  return NextResponse.json(updated);
}
```

## Requirements

- [ ] Accept optional body fields: `title`, `contentHtml`, `contentJson`, `contentPlain`, `categoryId`, `status`
- [ ] Build a dynamic `data` object with only the provided fields
- [ ] Validate `categoryId` if provided (must belong to the user's company)
- [ ] Keep the existing archive behavior via `{ status: "archived" }` in body
- [ ] Keep the existing auth and access checks
- [ ] Add role check: only `admin`/`super_admin` or the spiel's creator should be able to update

## Implementation

```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const spiel = await getSpielForAccess(id, access.companyId);
  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }
  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Build update payload dynamically
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.contentHtml !== undefined) data.contentHtml = body.contentHtml;
  if (body.contentJson !== undefined) data.contentJson = body.contentJson;
  if (body.contentPlain !== undefined) data.contentPlain = body.contentPlain;
  if (body.status !== undefined) data.status = body.status;

  if (body.categoryId !== undefined) {
    if (body.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: body.categoryId, companyId: access.companyId },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }
    data.categoryId = body.categoryId || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const updated = await prisma.spiel.update({
    where: { id },
    data,
    select: { id: true, title: true, status: true },
  });

  return NextResponse.json(updated);
}
```

## Files Affected

| File | Change |
|---|---|
| `app/api/spiels/[id]/route.ts` | **Modify** — Replace hardcoded archive with dynamic update |

## Dependencies

None (but needed by Plan 01).

## Acceptance Criteria

- [ ] PATCH with `{ title: "New Title" }` updates only the title
- [ ] PATCH with `{ contentHtml: "<p>new</p>", contentJson: "{}", contentPlain: "new" }` updates all content fields
- [ ] PATCH with `{ status: "archived" }` still works (backward compat)
- [ ] PATCH with `{ categoryId: null }` removes the category
- [ ] PATCH with invalid categoryId returns 404
- [ ] PATCH with empty body returns 400
- [ ] Existing auth/access checks still apply
