# Plan 10 — Remove Unused Dependencies

> **Priority:** 🟢 Minor
> **Checklist Ref:** `CHECKLIST.md` → #10

---

## What

Clean up unused and duplicate dependencies from `package.json`.

## Items to Clean

| Dependency | Issue |
|---|---|
| `framer-motion` | Installed at `^12.38.0` but never imported in any file |
| `postcss` | Listed in both `dependencies` and `devDependencies` — should only be in one |

## Requirements

- [ ] Remove `framer-motion` from `dependencies`
- [ ] Remove duplicate `postcss` entry from `dependencies` (keep in `devDependencies`)
- [ ] Run `npm install` to update lockfile
- [ ] Verify the app still builds and runs

## Files Affected

| File | Change |
|---|---|
| `package.json` | **Modify** — Remove `framer-motion`, deduplicate `postcss` |

## Dependencies

None.

## Acceptance Criteria

- [ ] `npm ls framer-motion` returns "(empty)"
- [ ] `postcss` appears only in `devDependencies`
- [ ] `npm run dev` and `npm run build` succeed
