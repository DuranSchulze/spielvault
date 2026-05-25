# Plan 13 — Add Confirmation Modal Component

> **Priority:** 🟢 Minor
> **Checklist Ref:** `CHECKLIST.md` → #13

---

## What

Create a reusable confirmation dialog component and replace all existing `window.confirm()` calls with it.

## Why

`window.confirm()` is a native browser API that:
- Looks different across browsers
- Cannot be styled or themed
- Is not keyboard-accessible consistently
- Provides no accessibility attributes

## Current Usage

**`components/spiels/spiel-list.tsx`** uses `window.confirm()` for archive and delete actions:

```ts
const confirmed = window.confirm(
  isArchiveMode
    ? `Permanently delete "${spiel.title}"? This cannot be undone.`
    : `Move "${spiel.title}" to archive?`,
);
if (!confirmed) return;
```

## Requirements

- [ ] Create `components/ui/confirm-dialog.tsx`
- [ ] Supports: title, description, confirm label, cancel label, confirm variant (default/destructive)
- [ ] Uses a modal overlay with proper ARIA attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`)
- [ ] Traps focus within the dialog when open
- [ ] Closes on Escape key
- [ ] Returns a promise that resolves to `boolean`
- [ ] Replace all `window.confirm()` calls

## Implementation

```tsx
// components/ui/confirm-dialog.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  // ... modal implementation with focus trap, escape, pointer trap
}
```

## Files Affected

| File | Change |
|---|---|
| `components/ui/confirm-dialog.tsx` | **Create** — New reusable modal |
| `components/spiels/spiel-list.tsx` | **Modify** — Use `ConfirmDialog` instead of `window.confirm()` |

## Dependencies

None.

## Acceptance Criteria

- [ ] "Archive" action shows a styled confirmation dialog instead of browser prompt
- [ ] "Delete" action shows a destructive-styled confirmation dialog
- [ ] Dialog can be dismissed with Escape key
- [ ] Clicking outside the dialog dismisses it
- [ ] Dialog is properly labeled for screen readers
