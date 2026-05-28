# Plan 18 — Browser Extension

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #18
> **Status:** Ready to implement

---

## What

A Chrome extension (Manifest V3) that lets users search, copy, and insert
spiels directly from any browser tab. Auth uses a personal API token generated
on the RepFlow profile page — no cookie sharing or CORS credential issues.

---

## Why

Sales reps and support agents need to insert spiels into CRMs, ticketing
systems, and email clients without switching tabs to the web app.

---

## Architecture Decision: Token-Based Auth

Browser extensions make requests from the `chrome-extension://` origin.
Cookie-based session auth requires `Access-Control-Allow-Credentials: true`
plus a specific origin (not `*`), and the extension ID changes per
installation. **Bearer token auth avoids all of this**:

- Extension sends `Authorization: Bearer svt_<token>` header
- No cookies → `Access-Control-Allow-Origin: *` works
- Token is scoped read-only to spiels
- User can revoke at any time from their Profile page

---

## Requirements

1. User generates a token on their Profile page ("Browser Extension" section).
2. User pastes the token + RepFlow URL into the extension Options page.
3. Extension popup: search bar, department filter, spiel list with Copy and
   Insert buttons per row.
4. Copy: writes `contentPlain` to clipboard.
5. Insert: injects `contentHtml` into `contenteditable` elements or
   `contentPlain` into `<textarea>`/`<input>` on the active page.
6. All spiel reads go through `GET /api/spiels` which accepts Bearer tokens.
7. The Next.js API is CORS-enabled for `GET /api/spiels` (no credentials needed).

---

## Approach

### Web App Changes

#### 1. Prisma schema — `ApiToken` model
```prisma
model ApiToken {
  id         String    @id @default(cuid())
  userId     String
  token      String    @unique
  name       String    @default("Browser Extension")
  createdAt  DateTime  @default(now())
  lastUsedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("api_token")
}
```

#### 2. `lib/auth/bearer-auth.ts`
Validates `Authorization: Bearer <token>`, updates `lastUsedAt`, returns the
same shape as `getAccessContextOrNull`.

#### 3. `GET /api/spiels`
New handler in `app/api/spiels/route.ts`. Accepts both cookie-session auth
and bearer-token auth. Query params: `q` (search), `department`, `take`
(capped at 50, default 20). Returns: `id, title, contentPlain, contentHtml,
department { name }, category { name }`.

#### 4. `app/api/extension/tokens/route.ts`
- `GET` — list the calling user's tokens (id, name, createdAt, lastUsedAt)
- `POST` — generate a new token (`svt_` + 32 random hex bytes); returns raw
  token once only

#### 5. `app/api/extension/tokens/[id]/route.ts`
- `DELETE` — revoke a token (only the owner can delete their own)

#### 6. Profile page — Extension token section
New section at the bottom of `profile-form.tsx` showing existing tokens and
a "Generate Token" button. Displays the raw token once after generation.

#### 7. CORS — `next.config.ts`
Add `headers()` to allow `GET /api/spiels` from any origin with
`Authorization` header. No credentials needed since auth is header-based.

---

### Extension Files (under `extension/`)

| File | Purpose |
|---|---|
| `manifest.json` | Chrome Manifest V3 — permissions, CSP, popup, content script |
| `popup.html` | Popup layout |
| `popup.css` | Popup styles (compact, ~360×500px) |
| `popup.js` | Search, render results, copy/insert, message background |
| `options.html` | Options page — URL + token fields |
| `options.js` | Save/load from `chrome.storage.sync` |
| `content.js` | Content script — receive insert message, inject into DOM |
| `background.js` | Service worker — relay insert message to active tab |
| `README.md` | How to load as unpacked extension + how to configure |

---

## Files Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `ApiToken` model + back-relation on `User` |
| `lib/auth/bearer-auth.ts` | **Create** — bearer token validator |
| `app/api/spiels/route.ts` | Add `GET` handler |
| `app/api/extension/tokens/route.ts` | **Create** — list + generate tokens |
| `app/api/extension/tokens/[id]/route.ts` | **Create** — revoke token |
| `app/(dashboard)/profile/profile-form.tsx` | Add Extension section |
| `next.config.ts` | Add CORS headers for `/api/spiels` |
| `extension/` (9 files) | **Create** — full extension |

---

## Acceptance Criteria

- [ ] User can generate and revoke API tokens on their Profile page.
- [ ] Token is displayed only once immediately after generation.
- [ ] `GET /api/spiels?q=hello` works with `Authorization: Bearer svt_…`.
- [ ] Extension popup shows spiels matching the search after configuring URL + token.
- [ ] Copy button copies plain text to clipboard.
- [ ] Insert button injects rich text into `contenteditable`, plain text into textarea/input.
- [ ] Unpacking `extension/` as a Chrome extension and following the README works end-to-end.
