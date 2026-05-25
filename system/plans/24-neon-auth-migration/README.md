# Plan 24 — Migrate from Stack Auth to Neon Auth with Better Auth

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #24

---

## What

Migrate the authentication system from the legacy Stack Auth-based implementation to Neon Auth with Better Auth.

## Why

Legacy Neon Auth (Stack Auth) is no longer accepting new users. The new Neon Auth with Better Auth offers:

- **Native Branching Support** — Auth branches automatically with database branches for isolated preview environments.
- **Database as Source of Truth** — No webhooks, no sync delays. Query users directly with SQL.
- **Simplified Configuration** — One environment variable instead of four.
- **Open-Source Foundation** — Built on Better Auth, enabling faster development of new features.

## Requirements

- [ ] Uninstall `@stackframe/stack` and install `@neondatabase/auth@latest` + `@neondatabase/auth-ui`
- [ ] Replace Stack Auth SDK initialization with `createAuthClient` (client) and `createNeonAuth` (server)
- [ ] Update environment variables (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` instead of Stack keys)
- [ ] Replace all UI components (`SignIn`, `SignUp`, `UserButton`) with Neon Auth equivalents (`AuthView`, `UserButton`)
- [ ] Replace `useUser()` hook with `useSession()` from `@neondatabase/auth`
- [ ] Replace `StackProvider`/`StackTheme` with `NeonAuthUIProvider`
- [ ] Replace auth handler route (`handler/[...stack]`) with `auth.handler()` at `api/auth/[...path]`
- [ ] Update route protection (component-level and middleware)
- [ ] Update server-side user access patterns
- [ ] Test all auth flows: sign-in, sign-up, session persistence, protected routes

## Approach

1. **Update dependencies** — Swap packages in `package.json`
2. **Create new client/server auth files** — `lib/auth/client.ts` and `lib/auth/server.ts`
3. **Update the root layout** — Replace `StackProvider` with `NeonAuthUIProvider`
4. **Update auth handler route** — Wire up `auth.handler()` in the catch-all API route
5. **Replace components** — Swap all Stack Auth components for Neon Auth equivalents
6. **Replace hooks** — Update all `useUser()` calls to `useSession()`
7. **Update middleware** — Add `auth.middleware()` in `proxy.ts`
8. **Remove old auth files** — Clean up `stack.ts` and any Stack Auth configuration
9. **Test end-to-end** — Verify login, signup, protected routes, and session persistence

## Files Affected (Estimated)

| File | Change |
|---|---|
| `package.json` | **Modify** — Swap dependencies |
| `.env.example` | **Modify** — Update env vars |
| `lib/auth/client.ts` | **Create** — Client-side auth |
| `lib/auth/server.ts` | **Create** — Server-side auth |
| `lib/auth/session.ts` | **Modify/Replace** — Update to use new auth |
| `app/layout.tsx` | **Modify** — Replace provider |
| `app/api/auth/[...all]/route.ts` | **Modify** — Use `auth.handler()` |
| `proxy.ts` | **Modify** — Add `auth.middleware()` |
| All auth-related components | **Modify** — Replace imports/hooks |

## Dependencies

- Will uninstall `@stackframe/stack`
- Will install `@neondatabase/auth@latest`, `@neondatabase/auth-ui`

## Acceptance Criteria

- [ ] Users can sign in with email/password
- [ ] Users can sign up with email/password
- [ ] Protected routes redirect unauthenticated users to sign-in
- [ ] User sessions persist across page reloads
- [ ] Server components can access session data
- [ ] All existing auth-dependent features continue to work
- [ ] Auth branches correctly with database preview environments
