# TECHNICAL.md

## Spiel Vault

## 1. Technical Overview

Spiel Vault is a **web application + browser extension-ready system** built with a **fixed core stack**:

- **Next.js**
- **Prisma**
- **PostgreSQL**

This stack is **non-negotiable** for this project because the system must support:

- a main web application
- a future Google Chrome extension
- possible future support for other browsers
- a shared backend and shared database across all client platforms

The system will be deployed on **Vercel**.

---

## 2. Fixed Core Stack

### Frontend

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

### Backend

- **Next.js Route Handlers / Server Actions**
- **Prisma ORM**
- **PostgreSQL**

### Authentication

- **Custom Email + Password Authentication**
- No Google login
- No Gmail login
- User credentials stored in database
- Passwords must be securely hashed

### Hosting

- **Vercel** for application hosting
- **PostgreSQL managed database** for persistent data storage

### Extension Support

- Architecture must be compatible with:
  - **Google Chrome Extension**
  - future browser extension versions
  - shared authentication and shared API usage

---

## 3. Main Technical Goal

Build a system where users can:

- sign up using **email and password**
- log in securely
- manage spiels inside the website
- organize spiels by company / department / category
- copy formatted spiels
- insert spiels into active fields through a browser extension in the future

The web app is the main admin and management platform.  
The extension is a secondary client that consumes the same backend.

---

## 4. System Architecture

### Architecture Style

Use a **single backend architecture**:

- **Next.js app** handles UI + server logic
- **Prisma** handles database access
- **PostgreSQL** stores all persistent data
- future browser extension communicates with the same backend

### High-Level Flow

- User signs up or logs in via web app
- Authenticated user accesses allowed companies, departments, and spiels
- User creates or edits a spiel using a rich text editor
- Spiel is stored in structured and reusable format
- User can copy the spiel or later use it through browser extension insertion

---

## 5. Authentication Architecture

## Auth Decision

Authentication for v1 is:

- **Email + Password only**
- No OAuth
- No Google Sign-In
- No social login

This is the fixed auth approach for the first version.

## Signup Fields

Required signup fields:

- Full Name
- Email
- Password

Optional fields if needed later:

- Company assignment
- Department assignment
- Role

## Login Fields

- Email
- Password

## Password Storage

Passwords must **never** be stored as plain text.

Use:

- hashed password storage
- secure comparison during login
- password reset flow later

Recommended user fields:

- `id`
- `fullName`
- `email`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Optional later:

- `emailVerifiedAt`
- `lastLoginAt`
- `deletedAt`

## Session Strategy

Use app authentication that supports:

- protected routes
- authenticated API usage
- future extension login support
- session persistence

Important rule:
The authentication approach must work for both:

- web app
- future browser extension

---

## 6. Database Choice

## Primary Database

- **PostgreSQL**

## ORM

- **Prisma**

## Reason

PostgreSQL + Prisma is the fixed database layer because it gives:

- strong relational support
- clean schema modeling
- good support for many-to-many relationships
- scalable structure for company / department / employee / spiel setup
- reliable support for future growth

---

## 7. Core Data Model

The system hierarchy is:

- Company
  - Department
    - Employee
      - Spiels

However, an employee can belong to **multiple departments**.

This means the real model must support:

- one company has many departments
- one company has many employees
- one department belongs to one company
- one employee belongs to one company
- one employee can belong to many departments
- one department can have many employees
- one department can have many spiels
- one employee can create many spiels
- one spiel belongs to one department
- one spiel belongs to one company
- one spiel belongs to one category

---

## 8. Suggested Prisma Entities

### User

Represents a system user / employee.

Fields:

- id
- fullName
- email
- passwordHash
- role
- companyId
- isActive
- createdAt
- updatedAt

### Company

Fields:

- id
- name
- slug
- createdAt
- updatedAt

### Department

Fields:

- id
- companyId
- name
- slug
- description
- createdAt
- updatedAt

### UserDepartment

Pivot table for many-to-many relation.

Fields:

- id
- userId
- departmentId
- createdAt

### Category

Fields:

- id
- companyId
- name
- slug
- description
- createdAt
- updatedAt

### Spiel

Fields:

- id
- companyId
- departmentId
- categoryId
- createdByUserId
- title
- description
- contentJson
- contentHtml
- contentPlain
- status
- createdAt
- updatedAt

### AuditLog (optional but recommended)

Fields:

- id
- userId
- action
- entityType
- entityId
- metadata
- createdAt

---

## 9. Rich Text Editor Requirement

Spiel content must support formatting because users need to paste content into Gmail and other places while preserving formatting as much as possible.

### Required Editor Features

- Bold
- Italic
- Underline
- Links
- Paragraphs
- Bullet list
- Ordered list
- Headings
- Text alignment
- Copy-ready formatting

### Storage Requirement

Each spiel should be stored in 3 forms:

#### 1. `contentJson`

Used for:

- editor state
- editing and restoring content safely

#### 2. `contentHtml`

Used for:

- rich copy
- paste into Gmail
- paste into rich text fields
- browser extension insertion

#### 3. `contentPlain`

Used for:

- plain text fallback
- search
- textarea insertion fallback

This is the recommended storage strategy for Spiel Vault.

---

## 10. Editor Recommendation

Use a **rich text editor compatible with Next.js**.

Requirements:

- works well with React / Next.js
- supports custom toolbar
- supports JSON output
- supports HTML output
- easy formatting controls
- easy future integration into extension workflows

The editor must be designed around:

- reliable storage
- reliable paste output
- easy user experience

---

## 11. Roles and Access

Recommended v1 roles:

### Super Admin

Can:

- manage companies
- manage all departments
- manage all users
- manage all categories
- manage all spiels

### Admin / Manager

Can:

- manage departments assigned to them
- manage users in allowed departments
- manage categories
- create and manage spiels

### Employee

Can:

- log in
- view spiels in departments they belong to
- create spiels if allowed
- edit their own spiels if allowed
- copy and use spiels

Access rule:
A user only sees spiels from departments they are assigned to.

---

## 12. Main Web Features

### Authentication

- Sign up
- Login
- Logout
- Protected dashboard

### Company Management

- Create company
- Update company
- View company users and departments

### Department Management

- Create department
- Update department
- Assign employees to departments
- View department members

### User Management

- Create user
- Update user
- Activate / deactivate user
- Assign department memberships

### Category Management

- Create category
- Update category
- Archive category if needed

### Spiel Management

- Create spiel
- Edit spiel
- Delete / archive spiel
- Filter by category
- Filter by department
- Search by title / content
- Copy spiel
- Preview spiel
- Use plain text or formatted version

---

## 13. Browser Extension Readiness

This project must be built in a way that a browser extension can be added without changing the main system design.

### Extension Use Cases

Future extension should allow user to:

- log in
- fetch accessible spiels
- search spiels
- copy spiel quickly
- insert spiel into currently active input or editor field
- use the same account as the website

### Technical Rule

The extension must **not** have a separate backend.

It must use:

- same authentication system
- same database
- same API/backend rules
- same permissions

### Backend Requirement for Extension

The backend should expose reusable endpoints or server-side actions for:

- login
- current user info
- spiel listing
- spiel detail
- department-based filtering
- category-based filtering

---

## 14. API / Backend Functional Areas

Recommended backend modules:

- Auth
- Users
- Companies
- Departments
- Categories
- Spiels
- Permissions
- Audit Logs

Each module should be kept clean and reusable.

---

## 15. Suggested Folder Direction

```txt
src/
  app/
    (auth)/
    dashboard/
    companies/
    departments/
    categories/
    spiels/
    api/
  components/
    ui/
    forms/
    editor/
    layout/
    spiels/
  lib/
    auth/
    prisma/
    permissions/
    validations/
    utils/
  server/
    services/
    repositories/
  types/
```
