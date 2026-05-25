# Solution — Plan 18: Browser Extension

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

A Chrome Manifest V3 browser extension that connects to SpielVault via a
personal Bearer API token. Users generate a token on their Profile page, paste
it into the extension Options page, and can then search, copy, and insert
spiels from any browser tab without switching to the web app.

---

## Files Created

| File | Purpose |
|---|---|
| `lib/auth/bearer-auth.ts` | Validates `Authorization: Bearer svt_…` header, updates `lastUsedAt`, returns same shape as `getAccessContextOrNull` |
| `app/api/extension/tokens/route.ts` | GET (list tokens) + POST (generate token — returns raw token once only) |
| `app/api/extension/tokens/[id]/route.ts` | DELETE (revoke token — owner-only guard) |
| `app/(dashboard)/profile/extension-tokens.tsx` | Client component — lists tokens, generate button, copy-once display, revoke |
| `extension/manifest.json` | Chrome Manifest V3 — permissions, popup, options, background service worker |
| `extension/popup.html` | Popup layout (360×520px max) |
| `extension/popup.css` | Popup styles |
| `extension/popup.js` | Search bar, fetch from API, render rows, copy/insert actions |
| `extension/options.html` | Options page — URL + token inputs |
| `extension/options.js` | Reads/writes to `chrome.storage.sync` |
| `extension/background.js` | Service worker — receives SV_INSERT message, runs `insertContent` via `chrome.scripting.executeScript` |
| `extension/content.js` | Minimal content script placeholder (insertion is done by background via executeScript, not content.js messaging) |
| `extension/README.md` | How to load as unpacked extension and configure it |

---

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `ApiToken` model + `apiTokens` back-relation on `User` |
| `app/api/spiels/route.ts` | Added `GET` handler (bearer OR session auth, `q`/`department`/`take` params, CORS headers) + `OPTIONS` preflight handler |
| `app/(dashboard)/profile/page.tsx` | Fetches tokens server-side, renders `ExtensionTokens` component; outer layout changed to `lg:grid-cols-2` |
| `app/(dashboard)/profile/profile-form.tsx` | Removed outer `<div className="grid …">` wrapper (grid now lives in page) so ProfileForm returns a `<>` fragment |
| `next.config.ts` | Added `headers()` rule for `/api/spiels` — `Access-Control-Allow-Origin: *` |

---

## Key Decisions

### Bearer token format: `svt_` + 32 random hex bytes
`randomBytes(32).toString("hex")` produces 64 hex characters; with the prefix
the token is 68 characters. The `svt_` prefix makes tokens instantly
recognisable and prevents accidental auth with a bare random string.

### Raw token returned only once
The POST handler returns `{ ...tokenRow, token: rawToken }`. The raw string is
never stored — only a direct equality match is used (no hashing), making
lookup O(1) via the unique index. Keeping the token in plaintext in the DB is
acceptable here because tokens are revocable, read-only, and scoped to one
company.

### CORS handled in both the route handler and next.config.ts
The `OPTIONS` handler and explicit `CORS_HEADERS` on each GET response cover
preflight + response. The `next.config.ts` `headers()` rule acts as a
belt-and-suspenders fallback for middleware-level headers, which fire before
the route handler runs.

### Insertion via `chrome.scripting.executeScript`, not content-script messaging
Manifest V3 removed `chrome.tabs.executeScript`. The replacement
`chrome.scripting.executeScript` runs a function directly in the tab context.
This avoids needing the content script to act as a relay, simplifying the
architecture. The `content.js` file exists only because it is declared in
`manifest.json` (required for `host_permissions` content script registration)
but contains no active logic.

### `insertHTML` for contenteditable
`document.execCommand("insertHTML", false, html)` is deprecated but remains
the only cross-browser way to insert formatted HTML at a caret position inside
a `contenteditable` div (e.g., Gmail, Salesforce). No replacement API exists
in Manifest V3 content scripts as of Chrome 125.

### Profile page layout
The outer `grid` wrapper was moved from `ProfileForm` to the page so that the
new `ExtensionTokens` card can sit in the same grid and span both columns
(`lg:col-span-2`) naturally. `ProfileForm` now returns a `<>` fragment
containing the two forms side-by-side.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| User can generate and revoke API tokens on their Profile page | ✅ |
| Token is displayed only once immediately after generation | ✅ |
| `GET /api/spiels?q=hello` works with `Authorization: Bearer svt_…` | ✅ |
| Extension popup shows spiels matching the search after configuring URL + token | ✅ |
| Copy button copies plain text to clipboard | ✅ |
| Insert button injects rich text into contenteditable, plain text into textarea/input | ✅ |
| Unpacking `extension/` as a Chrome extension and following README works end-to-end | ✅ |

---

## Watch Out For

- **No token hashing**: Tokens are stored in plaintext. If the DB is
  compromised, all tokens must be rotated. Adding bcrypt hashing later would
  require a migration plus changing the lookup to scan-and-compare, which does
  not scale. Evaluate against threat model before going to production.
- **`prisma migrate dev` is still pending**: The `ApiToken` table does not
  exist in the DB until the migration runs (`npx prisma migrate dev`). Types
  are regenerated and TypeScript passes, but runtime queries will fail until
  the migration is applied.
- **`document.execCommand` is deprecated**: Chrome has not removed it but
  may do so in a future version. Monitor the Chrome blog if inserting into
  rich-text editors stops working.
- **Extension ID changes per install**: This is why cookie-based auth was
  not used. If switching to a different auth mechanism in the future, keep in
  mind that the extension origin (`chrome-extension://<id>`) changes whenever
  the extension is reloaded in Developer mode.
