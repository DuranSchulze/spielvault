# Plan 25 — Teams & Invitations

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #25
> **Status:** Ready to implement

---

## What

A lightweight **Teams** layer that sits above Departments. Any user can create a
team, invite other users (by email), and accepted members can invite more
people. All team members share access to the spiels the team owns, regardless
of which department each member belongs to.

---

## Why

The current model locks spiels to Departments, and users to a single Company.
In practice, teams need cross-department collaboration — a Sales spiel may be
useful to a Support agent, or a project may span HR and Engineering. Teams
enable:

- Viral, user-driven group formation ("I'll invite you to my team")
- Shared spiel libraries without admin intervention
- A lightweight alternative to department-membership being the only sharing
  mechanism

---

## Requirements

1. Any authenticated user can **create a team** (name, optional description).
2. The creator becomes the **team owner**.
3. Any team member can **invite other users** by email (existing users within
   the same company only for v1).
4. Invited users see a pending invitation notification in the UI. They can
   **accept** or **decline**.
5. Once accepted, the new member can also invite others (viral growth).
6. Team members can **create spiels scoped to the team** — these spiels are
   visible to all current and future team members.
7. A user can **belong to multiple teams**.
8. Team owners can **remove members** and **delete the team**.
9. Members can **leave a team** voluntarily.
10. The existing Department-based spiel visibility must remain untouched —
    Teams add a new sharing axis, not a replacement.

---

## Design Decisions

- **Teams are within a Company** — you cannot invite users from other companies.
  This keeps the data boundary consistent with the rest of the app.
- **Spiels belong to one team OR one department** — a spiel has an optional
  `teamId` field. If `teamId` is set, the spiel is visible to all team members.
  If only `departmentId` is set, visibility follows the existing department
  rules. This avoids complex multi-ownership merging.
- **No roles within a team (v1)** — every member has equal access except the
  owner who has moderation powers (remove members, delete team). Role-based
  team hierarchies can be added later (plan #XX).
- **Invites expire after 7 days** — stale invites are cleaned up via a cron
  job or on-read expiry check.

---

> **Prerequisite:** This plan depends on **Plan #23 (Migrate from Prisma to Drizzle ORM)**.
> The schema below uses Drizzle's `pgTable` syntax. Do **not** implement this until Prisma has
> been fully replaced and the Drizzle migration is complete.

## Data Model

New Drizzle schema files go in `lib/drizzle/schema/`. Add a new file
`lib/drizzle/schema/teams.ts` with the following tables:

```typescript
import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";
import { spiels } from "./spiels";
import { createCuid } from "../utils";

// ─── Team ────────────────────────────────────────────────────────────

export const teams = pgTable("team", {
  id: text("id").primaryKey().$defaultFn(createCuid),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  companySlugIdx: uniqueIndex("team_company_slug_idx").on(table.companyId, table.slug),
}));

// ─── Team Member ─────────────────────────────────────────────────────

export const teamMembers = pgTable("team_member", {
  id: text("id").primaryKey().$defaultFn(createCuid),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // "owner" | "member"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  teamUserIdx: uniqueIndex("team_member_team_user_idx").on(table.teamId, table.userId),
}));

// ─── Team Invitation ─────────────────────────────────────────────────

export const teamInvitations = pgTable("team_invitation", {
  id: text("id").primaryKey().$defaultFn(createCuid),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  invitedBy: text("invited_by").notNull(),        // userId who sent the invite
  token: text("token").notNull().unique(),         // unique accept/decline token
  status: text("status").notNull().default("pending"), // "pending" | "accepted" | "declined" | "expired"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),    // 7 days from creation
});

// ─── Relations ───────────────────────────────────────────────────────

export const teamsRelations = relations(teams, ({ one, many }) => ({
  company: one(companies, { fields: [teams.companyId], references: [companies.id] }),
  createdBy: one(users, { fields: [teams.createdById], references: [users.id] }),
  members: many(teamMembers),
  spiels: many(spiels),
  invitations: many(teamInvitations),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  team: one(teams, { fields: [teamInvitations.teamId], references: [teams.id] }),
}));
```

### Changes to existing schema

**`lib/drizzle/schema/spiels.ts`** — Add an optional `teamId` column:

```typescript
export const spiels = pgTable("spiel", {
  // ... existing columns ...
  teamId: text("team_id"),  // NEW — null means department-scoped only
  // ... existing columns ...
});
```

Then add the relation:

```typescript
export const spielsRelations = relations(spiels, ({ one, many }) => ({
  // ... existing relations ...
  team: one(teams, { fields: [spiels.teamId], references: [teams.id] }),
}));
```

**`lib/drizzle/schema/users.ts`** — Add back-relations:

```typescript
export const usersRelations = relations(users, ({ one, many }) => ({
  // ... existing relations ...
  teamMemberships: many(teamMembers),
  ownedTeams: many(teams, { relationName: "ownedTeams" }),
}));
```

### Migration

After adding the schema, generate and apply the migration:

```sh
npx drizzle-kit generate --name add-teams
npx drizzle-kit migrate
```

---

## API Routes

### Teams CRUD

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/teams` | List teams the current user belongs to |
| `POST` | `/api/teams` | Create a new team |
| `GET` | `/api/teams/[id]` | Get team details + members |
| `PATCH` | `/api/teams/[id]` | Update team name/description (owner only) |
| `DELETE` | `/api/teams/[id]` | Delete team (owner only; cascades members + invites) |

### Members

| Method | Path | Description |
|---|---|---|
| `DELETE` | `/api/teams/[id]/members/[userId]` | Remove a member (owner only) |
| `POST` | `/api/teams/[id]/leave` | Current user leaves the team |

### Invitations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/teams/[id]/invite` | Send invite by email (any member) |
| `GET` | `/api/invitations` | List pending invitations for current user |
| `POST` | `/api/invitations/[token]/accept` | Accept invitation |
| `POST` | `/api/invitations/[token]/decline` | Decline invitation |

### Spiel scoping

| Method | Path | Description |
|---|---|---|
| `PATCH` | `/api/spiels/[id]/team` | Move spiel to a team scope (set `teamId`) |
| `DELETE` | `/api/spiels/[id]/team` | Remove team scope (set `teamId` to null) |

---

## UI / Pages

### Teams Dashboard

- **`/teams`** — Lists the user's teams. Each card shows team name, member
  count, spiel count. "Create Team" button.
- **`/teams/new`** — Form: name, description. Auto-generate slug.
- **`/teams/[id]`** — Team detail page:
  - Members list with "Remove" button (owner only)
  - "Invite" button → opens invite dialog (email input)
  - "Leave Team" button
  - "Delete Team" button (owner only, with ConfirmDialog)
  - List of spiels belonging to this team
  - "New Spiel" button → pre-fills `teamId` in the create form

### Invitation Notifications

- A bell/indicator in the sidebar (near the user menu) showing pending invite
  count.
- A notification dropdown or dedicated `/invitations` page listing:
  - Team name
  - Who invited you
  - Accept / Decline buttons

### Spiel Form Changes

- On the create/edit spiel page, add a **Scope** section:
  - Radio/select: "Department" (existing) vs "Team" (new)
  - If "Department" → show department dropdown (existing)
  - If "Team" → show team dropdown (teams the user belongs to)
- On the library page (`/spiels`), add a **Teams** filter chip alongside
  Departments and Favorites.

### Sidebar Navigation

Add a **Teams** link to the sidebar:

```
Teams
├─ My Teams (show count)
├─ Invitations (show pending count badge)
```

---

## Permission Logic

| Action | Who can do it |
|---|---|
| Create a team | Any authenticated user |
| Update team name/description | Owner only |
| Delete team | Owner only |
| Invite a member | Any team member |
| Accept/decline invite | The invited user (via unique token) |
| Remove a member | Owner only |
| Leave team | Any member (except owner — owner must delete or transfer) |
| View team spiels | Any team member |
| Create spiel in team | Any team member |
| Edit/delete team spiel | Creator of the spiel or team owner |

New permission helpers in `lib/permissions/teams.ts`:

```ts
export function canManageTeam(userId: string, team: { createdById: string }): boolean
export function canRemoveMember(actorRole: string, targetRole: string): boolean
export function isTeamMember(userId: string, members: { userId: string }[]): boolean
```

---

## Files Affected

| File | Change |
|---|---|
| `lib/drizzle/schema/teams.ts` | **Create** — `teams`, `teamMembers`, `teamInvitations` tables + relations |
| `lib/drizzle/schema/spiels.ts` | **Modify** — Add optional `teamId` column + team relation |
| `lib/drizzle/schema/users.ts` | **Modify** — Add `teamMemberships` and `ownedTeams` back-relations |
| `drizzle/` | Auto-generated by `drizzle-kit generate --name add-teams` |
| `types/index.ts` | Add `TeamMemberRole` type, update `SpielCardData` |
| `lib/permissions/teams.ts` | **Create** — team-specific permission helpers |
| `lib/validations/team.ts` | **Create** — Zod schemas for create/invite |
| `app/api/teams/route.ts` | **Create** — GET (list), POST (create) |
| `app/api/teams/[id]/route.ts` | **Create** — GET, PATCH, DELETE |
| `app/api/teams/[id]/invite/route.ts` | **Create** — POST invite |
| `app/api/teams/[id]/members/[userId]/route.ts` | **Create** — DELETE member |
| `app/api/teams/[id]/leave/route.ts` | **Create** — POST leave |
| `app/api/invitations/route.ts` | **Create** — GET pending invites |
| `app/api/invitations/[token]/accept/route.ts` | **Create** — POST accept |
| `app/api/invitations/[token]/decline/route.ts` | **Create** — POST decline |
| `app/api/spiels/[id]/team/route.ts` | **Create** — PATCH/DELETE team scope |
| `components/layout/sidebar-nav.tsx` | Add Teams link + invite badge |
| `components/layout/account-actions.tsx` | Add notification bell for invites |
| `app/(dashboard)/teams/page.tsx` | **Create** — Teams list page |
| `app/(dashboard)/teams/new/page.tsx` | **Create** — Create team form |
| `app/(dashboard)/teams/[id]/page.tsx` | **Create** — Team detail page |
| `app/(dashboard)/invitations/page.tsx` | **Create** — Invitations page |
| `app/(dashboard)/spiels/page.tsx` | Add Teams filter chip, team scope in create |
| `components/spiels/spiel-form.tsx` | Add scope selector (dept vs team) |
| `lib/drizzle/seed.ts` | Optionally seed a sample team |

---

## Acceptance Criteria

- [ ] Any user can create a team and is automatically the owner.
- [ ] Team owner can invite existing company users by email.
- [ ] Invited user sees a pending invitation in a notification area.
- [ ] Accepted invite adds the user to the team; declined invite is hidden.
- [ ] Any team member can invite additional members.
- [ ] Team members can create spiels scoped to the team.
- [ ] Team spiels are visible to all team members in the library (with a
      "Teams" filter chip).
- [ ] A spiel scoped to a team is NOT visible to users outside the team
      (regardless of department membership).
- [ ] Owner can remove members and delete the team.
- [ ] Members can leave a team voluntarily.
- [ ] Invitation tokens expire after 7 days (gracefully handled on read).
- [ ] All existing Department-based spiel visibility continues to work
      unchanged.
- [ ] Multiple teams can share the same spiel? (V1: No — a spiel has one
      scope. Use a Team to share it. If cross-sharing is needed later, a
      `SpielTeam` join table can be added in a follow-up plan.)

---

## Relationship to Other Plans

**This plan must be implemented after Plan #23 (Drizzle ORM Migration).** The Drizzle
migration rewrites the entire database access layer from Prisma to Drizzle. Plan #25's
schema additions (`teams.ts`) should be authored in Drizzle's `pgTable` syntax from the
start, and all route handlers should use Drizzle's query builder (`db.insert()`, `db.select()`, etc.)
instead of Prisma.

Plan #24 (Neon Auth) is independent of this plan — they can be done in any order once
Drizzle is in place.

---

## Future Considerations

- **Team roles** — `admin`, `editor`, `viewer` within a team (v2).
- **Cross-company teams** — invite users from external companies (v3+; requires
  changes to data boundary).
- **Team chat / comments** — per-team discussion on spiels.
- **Team analytics** — per-team usage stats.
- **Bulk invite** — CSV upload to invite many users at once.
