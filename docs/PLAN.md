# PLAN.md
# Spiel Vault — Product Plan

## 1. Product Name
**Spiel Vault**

## 2. Executive Summary
Spiel Vault is a lightweight internal product for storing, organizing, and reusing company-approved spiels through a web app and a browser extension.

The product solves a simple but costly workflow problem: employees repeatedly rewrite the same responses, use outdated messaging, or waste time searching across notes, chats, and documents. Spiel Vault becomes the single source of truth for reusable communication content.

The system should feel fast, simple, and operationally useful from day one.

---

## 3. Vision
Create the easiest way for teams to save, organize, find, copy, and insert reusable spiels anywhere they work.

---

## 4. Product Goal
Build a simple multi-tenant spiel repository where:
- companies manage their own content
- departments organize spiels by team or function
- employees can belong to multiple departments
- employees can quickly reuse spiels through the website or extension
- formatting is preserved when pasting into Gmail and similar tools

---

## 5. Business Problem
Teams usually have these issues:
- no central repository for approved messaging
- different departments use different wording
- employees copy old or wrong spiels
- searching for a spiel takes too long
- formatting breaks when pasted into target systems
- useful spiels remain stuck in personal notes or chats

Spiel Vault should remove these friction points.

---

## 6. Target Users
### Primary Users
- employees who frequently send repeated messages
- support teams
- sales teams
- collections teams
- operations teams
- recruiters or coordinators using repeated communication

### Secondary Users
- department managers
- company admins
- quality/compliance owners who want approved wording

---

## 7. Product Value
### For Employees
- faster message reuse
- less typing
- more consistent responses
- easier access to department-approved spiels

### For Managers
- better message consistency
- easier organization by team and category
- less dependency on tribal knowledge

### For Company Admins
- centralized control
- cleaner permissions
- scalable structure for teams and departments

---

## 8. Product Principles
- simple first
- fast retrieval over feature overload
- minimal clicks to use a spiel
- preserve formatting when possible
- permissions must be clear
- extension must be practical, not complex
- dashboard is for managing, extension is for using

---

## 9. Core Product Structure
Hierarchy:
- Company
  - Department
    - Employee
    - Spiels

Rules:
- one company has many departments
- one employee can belong to many departments
- spiels are primarily scoped to a department
- categories are used to organize spiels inside a department
- users only see content inside their company and assigned departments

---

## 10. Core Feature Scope
### A. Authentication and Access
- sign up
- sign in
- sign out
- protected dashboard
- role-based access
- company membership handling

### B. Company Management
- create company workspace
- update company details
- invite members
- manage company-level roles

### C. Department Management
- create department
- edit department
- archive department
- assign members to department
- allow a user to belong to many departments

### D. Employee Access Management
- invite employee
- assign employee to company
- assign employee to one or more departments
- view accessible departments per employee

### E. Spiel Management
- create spiel
- edit spiel
- archive spiel
- duplicate spiel
- search spiel
- filter by department
- filter by category
- sort by title and updated date

### F. Category Management
- create category
- edit category
- archive category
- assign category to spiel
- support uncategorized spiels

### G. Rich Text Editing
- bold
- italic
- underline
- links
- alignment
- bullet list
- numbered list
- headings
- blockquote
- undo/redo

### H. Usage Actions
- copy as plain text
- copy as rich text
- insert into active field from extension
- open source spiel details

### I. Browser Extension
- login session support
- search accessible spiels
- view department spiels
- filter by category
- quick copy
- quick insert into active field
- open dashboard when editing is needed

---

## 11. MVP Scope
The MVP should only include the features required to prove daily utility.

### Must Have
- authentication
- company setup
- department setup
- employee assignment to departments
- category management
- spiel CRUD
- rich text editor
- rich text and plain text storage
- search and filter
- browser extension popup
- copy and insert actions

### Should Not Be in MVP
- approvals workflow
- advanced analytics
- AI generation
- comments
- mention/tagging
- public sharing
- import/export tools
- template marketplace
- version comparison UI

---

## 12. Phase Plan
### Phase 1 — Foundation
Goal: make the system usable internally.
- auth and workspace creation
- company and department structure
- user-to-department access
- spiel CRUD
- category CRUD
- rich text editor
- dashboard list/search/filter

### Phase 2 — Extension Utility
Goal: make the system useful during real work.
- browser extension auth
- popup UI
- spiel search
- copy plain text
- copy rich text
- insert into active field
- fallback behavior for unsupported pages

### Phase 3 — Team Operations
Goal: improve adoption and governance.
- favorites
- pinned spiels
- recent spiels
- activity logs
- archive flows
- better permission controls

### Phase 4 — Scale Features
Goal: support bigger teams and stricter process needs.
- version history
- approval states
- usage analytics
- import/export
- advanced search

---

## 13. Recommended Roles
### Company Admin
- full company access
- manages departments, members, categories, spiels

### Department Manager
- manages assigned department content and membership visibility

### Employee
- uses spiels from assigned departments
- can create or edit content only if permitted

---

## 14. Success Metrics
### Product Metrics
- number of active companies
- number of active users per week
- number of spiels created
- number of copy actions
- number of insert actions
- search-to-use conversion rate

### Workflow Metrics
- reduced time to send repeated messages
- reduced duplicate spiel creation
- increased usage of approved messaging

### Operational Metrics
- dashboard load speed
- editor save success rate
- extension insert success rate

---

## 15. Risks
### Product Risks
- too many features too early
- unclear role permissions
- extension becomes unreliable on some websites
- users still keep spiels outside the system

### Technical Risks
- rich text paste differences across websites
- auth handling between web app and extension
- content sanitization and safe HTML output
- permission leakage across companies or departments

### Adoption Risks
- users do not trust the source of truth
- managers do not maintain categories and structure
- poor search quality makes users stop using the product

---

## 16. Decisions to Lock Early
These should be decided early and not keep changing:
- one canonical editor format
- how company and department permissions work
- whether employees can create department spiels or only personal drafts
- whether categories are company-wide or department-based
- whether archived content stays searchable
- extension insert behavior priority: plain text vs rich text fallback

---

## 17. Recommended Operational Rules
- every spiel belongs to one department
- every spiel may have one category initially
- every user must belong to a company
- every user can belong to many departments
- all content visibility is scoped by company and department
- rich text should be sanitized before rendering or inserting

---

## 18. Launch Readiness Checklist
Before launch, the product must have:
- secure auth
- clean permissions
- stable spiel editor
- stable save/update flow
- working search and filters
- reliable extension copy action
- acceptable insert behavior for textarea and contenteditable targets
- audit-friendly ownership fields

---

## 19. CEO / PM Recommendation
The first win is not a large feature set. The first win is making employees say:

> “I found the spiel quickly and used it in seconds.”

That means the product should focus on:
1. fast access
2. good organization
3. reliable formatting
4. simple permissions
5. extension convenience

Everything else can come later.
