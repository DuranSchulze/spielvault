# Plan 13 — Add Confirmation Modal Component — Solution

> **Status:** ✅ Complete
> **Date:** 2026-05-23

## What Was Done

Created a reusable `ConfirmDialog` component and replaced all `window.confirm()` calls in the codebase with it.

## Changes

### New Files

| File | Purpose |
|---|---|
| `components/ui/confirm-dialog.tsx` | Reusable accessible confirmation modal |

### Modified Files

| File | Change |
|---|---|
| `components/spiels/spiel-list.tsx` | Replaced `window.confirm()` with `ConfirmDialog` |
| `components/users/users-manager.tsx` | Replaced `window.confirm()` with `ConfirmDialog` |

## Component Features

- **ARIA attributes:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- **Focus trap:** Tab/Shift+Tab cycles through focusable elements within the dialog
- **Escape key:** Closes the dialog unless loading
- **Backdrop click:** Closes the dialog unless loading
- **Body scroll lock:** Prevents background scrolling while dialog is open
- **Destructive variant:** Red confirm button for delete/deactivate actions
- **Loading state:** Shows spinner and disables buttons during async operations
- **Close button:** X button in the top-right corner

## Usage Pattern

```tsx
// State
const [confirmOpen, setConfirmOpen] = useState(false);

// Trigger
<button onClick={() => setConfirmOpen(true)}>Delete</button>

// Dialog
<ConfirmDialog
  open={confirmOpen}
  title="Confirm action"
  description="Are you sure?"
  variant="destructive"
  confirmLabel="Delete"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
  isLoading={isDeleting}
/>
```

## What Was Replaced

| Location | Old Pattern | New Pattern |
|---|---|---|
| `spiel-list.tsx` archive action | `window.confirm("Move to archive?")` | `ConfirmDialog` with "default" variant |
| `spiel-list.tsx` delete action | `window.confirm("Permanently delete?")` | `ConfirmDialog` with "destructive" variant |
| `users-manager.tsx` deactivate action | `window.confirm("Deactivate this user?")` | `ConfirmDialog` with "destructive" variant |

## Decisions Made

- Used a state-driven approach (`open` prop + `onConfirm`/`onCancel` callbacks) rather than a promise-based API like `window.confirm()`. This keeps the component idiomatic with React's declarative model and avoids complexity of managing promise resolution across renders.
- The `confirmLabel` prop defaults to "Confirm" so callers can be concise.
