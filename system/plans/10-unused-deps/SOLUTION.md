# Plan 10 — Remove Unused Dependencies — Solution

> **Status:** ✅ Complete (with amendment)
> **Date:** 2026-05-23

## What Was Done

Cleaned up unused and duplicate dependencies from `package.json`.

## Changes

| File | Change |
|---|---|
| `package.json` | Removed `framer-motion` from `dependencies` (initially); removed duplicate `postcss` entry from `dependencies` (it remains in `devDependencies` via `@tailwindcss/postcss`) |

## Correction — `framer-motion` Had to Be Re-added

`framer-motion` is a **peer dependency** of `goey-toast@0.3.0` (declared as `>=10.0.0`). Removing it from `package.json` caused Turbopack to fail resolving the module at runtime:

```
Module not found: Can't resolve 'framer-motion'
  ./node_modules/goey-toast/dist/index.js:3:1
```

**Resolution:** Re-added `framer-motion@^12.38.0` as a direct dependency. It cannot be removed because `goey-toast` requires it at runtime. The plan acceptance criteria listing "`npm ls framer-motion` returns (empty)" is unachievable while `goey-toast` remains a dependency.

## What Was Actually Removed

- **`postcss`** — Successfully removed the duplicate entry from `dependencies`. It now only appears transitively via `@tailwindcss/postcss`, `next`, and `shadcn`.

## Verification

- `npm install` completes successfully.
- The app starts and renders without module resolution errors.
- `postcss` no longer appears as a direct dependency.
- `framer-motion` remains as a direct dependency due to `goey-toast`'s peer dependency requirement.
