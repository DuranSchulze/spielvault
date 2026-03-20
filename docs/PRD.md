# PRD.md

## Spiel Vault

## 1. Product Overview

Spiel Vault is a web-based spiel management system built for teams that need a fast and organized way to store, manage, search, copy, and later insert reusable spiels.

A spiel is a reusable block of formatted text used for communication, responses, support, sales, internal messaging, outreach, or any repeated written workflow.

Spiel Vault will serve as:

- a centralized repository of spiels
- a department-based access system for teams
- a management dashboard for creating and organizing spiels
- a future browser extension-enabled tool for fast usage inside websites and online tools

The first version focuses on the web application, while keeping the product architecture ready for browser extension support.

---

## 2. Product Vision

Create a simple and reliable platform where teams can:

- save reusable spiels
- organize them clearly
- access only the spiels relevant to their departments
- reuse them quickly with formatting preserved
- prepare for direct insertion through a future browser extension

Spiel Vault should reduce repetitive typing, improve consistency in team communication, and make approved messaging easier to access and use.

---

## 3. Problem Statement

Teams often repeat the same responses, scripts, templates, or communication blocks across multiple platforms.

Without a dedicated spiel system, common problems happen:

- repeated manual typing
- inconsistent wording across employees
- poor organization of reusable scripts
- difficulty finding the correct spiel quickly
- no shared source of truth
- limited formatting support when storing reusable responses
- no easy way to reuse formatted content across tools like Gmail or web forms

Spiel Vault solves this by providing a structured and searchable repository of reusable formatted spiels.

---

## 4. Product Goals

### Primary Goals

- provide a central place to store spiels
- allow employees to access department-based spiels
- support rich text formatting for better reuse
- make it easy to copy and use spiels
- keep the product simple and easy to adopt

### Secondary Goals

- prepare the product for browser extension support
- improve quality and consistency of team messaging
- make spiel retrieval faster through search and filters
- support company and department-based organization

---

## 5. Success Metrics

The product will be successful if it achieves:

- faster spiel retrieval time
- reduced repeated manual typing
- higher consistency in responses across teams
- active usage of stored spiels by employees
- organized spiel libraries by department and category
- successful support for formatted copy/paste workflows

Suggested product metrics:

- number of active users
- number of spiels created
- number of spiels copied
- number of searches performed
- average time to find a spiel
- number of departments actively using the system

---

## 6. Target Users

### Primary Users

- employees who regularly use repeated text responses
- support teams
- sales teams
- internal operations teams
- administrative staff

### Secondary Users

- department managers
- company admins
- team leads
- super admins managing the whole system

---

## 7. User Roles

### Super Admin

Responsible for full platform management.

Can:

- manage companies
- manage departments
- manage users
- manage categories
- manage all spiels
- view all data

### Admin / Manager

Responsible for operational management inside allowed scope.

Can:

- manage departments assigned to them
- manage users in those departments
- manage categories
- create and manage spiels
- monitor team usage if needed

### Employee

Main end user of the product.

Can:

- sign in
- view accessible spiels
- search and filter spiels
- copy and use spiels
- create spiels if permission is allowed
- edit own spiels if permission is allowed

---

## 8. Core Product Scope

Spiel Vault v1 includes:

- email and password signup
- login and logout
- user account management
- company and department-based structure
- employee-to-department assignment
- category management
- spiel creation
- spiel editing
- spiel storage with formatting
- spiel search
- spiel filtering
- spiel copy action
- protected access based on department membership

Spiel Vault v1 does not include:

- Google login
- Gmail authentication
- social login
- public sharing
- approval workflow
- browser extension full release
- advanced analytics dashboard
- AI-generated spiels

---

## 9. User Stories

### Authentication

- As a new user, I want to sign up using email and password so I can access the system.
- As a user, I want to log in securely so I can access my company’s spiels.
- As a user, I want to log out safely so my session is protected.

### Access and Permissions

- As an employee, I want to see only the departments I belong to so I only access relevant spiels.
- As an employee, I want to see only the spiels available to my departments.
- As an admin, I want to assign users to departments so access is controlled properly.

### Spiel Management

- As a user, I want to create a spiel so I can store reusable messaging.
- As a user, I want to edit a spiel so I can update outdated content.
- As a user, I want to categorize a spiel so I can organize it better.
- As a user, I want to search spiels so I can find the correct one quickly.
- As a user, I want to copy a spiel so I can paste it where needed.
- As a user, I want formatted text to remain useful when I paste it into other tools.

### Organization

- As an admin, I want categories to help with sorting and filtering.
- As a manager, I want department-based organization so teams only see the right spiels.

### Future Extension Readiness

- As a future browser extension user, I want the same account and same spiel access so I can use the tool outside the website.

---

## 10. Functional Requirements

## 10.1 Authentication

The system must allow:

- user signup using email and password
- user login using email and password
- user logout
- secure session handling
- protected routes for authenticated users only

The system must not require:

- Google login
- OAuth-based login in v1

---

## 10.2 User Management

The system must allow admins to:

- create users
- update users
- activate or deactivate users
- assign users to departments
- manage user roles

The system must allow users to:

- view their own account information

---

## 10.3 Company Management

The system must support:

- company creation
- company update
- company-based grouping of departments and users

At minimum, one user belongs to one company.

---

## 10.4 Department Management

The system must allow:

- creating departments
- updating departments
- assigning users to one or more departments
- viewing department members

A user may belong to multiple departments.

---

## 10.5 Category Management

The system must allow:

- creating categories
- editing categories
- viewing categories
- using categories for spiel sorting and filtering

Categories improve organization of spiels.

---

## 10.6 Spiel Management

The system must allow:

- creating a spiel
- editing a spiel
- archiving or deleting a spiel
- viewing spiel details
- filtering spiels
- searching spiels
- copying spiels

Each spiel must include:

- title
- department
- category
- creator
- content
- timestamps

Optional fields:

- description
- status

---

## 10.7 Rich Text Editing

The system must provide a text editor for creating and editing spiels.

Editor must support:

- bold
- italic
- underline
- links
- headings
- bullet lists
- ordered lists
- text alignment
- paragraph formatting

Rich text is required because users will copy and paste spiels into platforms like Gmail or other text fields.

The system must preserve formatting as much as possible during storage and reuse.

---

## 10.8 Search and Filtering

The system must support:

- search by spiel title
- search by category
- search by department
- search by text content
- filter by category
- filter by department
- filter by creator
- filter by status if status exists

---

## 10.9 Copy and Reuse

The system must allow users to:

- copy formatted spiel content
- copy plain text spiel content if needed
- preview spiel before copying

The product should optimize for fast reuse.

---

## 10.10 Permissions and Visibility

The system must enforce:

- users only see spiels for departments they belong to
- users only access allowed categories and related spiels within company boundaries
- admins have wider access based on role
- super admins have full access

---

## 11. Non-Functional Requirements

### Usability

- interface should be simple
- core actions should be easy to understand
- search and copy actions should be fast

### Performance

- spiel list should load quickly
- search should feel responsive
- content loading should remain smooth even with many spiels

### Security

- passwords must be securely hashed
- protected routes must require authentication
- user access must follow role and department permissions
- no plain text password storage

### Scalability

- system should support multiple companies
- system should support multiple departments per user
- system should support future browser extension usage

### Reliability

- users should not lose spiel content during create or edit
- copied content should be consistent and usable

---

## 12. Information Architecture

Top-level product structure:

- Authentication
- Dashboard
- Companies
- Departments
- Users
- Categories
- Spiels

Spiel hierarchy:

- Company
  - Department
    - Employees
    - Spiels

Additional rule:

- employees can belong to multiple departments
- categories are used to organize spiels

---

## 13. Main Screens

### Public / Auth Screens

- Sign Up
- Login

### Protected Screens

- Dashboard
- Spiels List
- Create Spiel
- Edit Spiel
- Spiel Detail / Preview
- Categories Management
- Departments Management
- Users Management
- Company Settings

---

## 14. v1 Core Features

### Must Have

- email/password authentication
- protected dashboard
- user management
- department membership
- category management
- rich text spiel editor
- spiel create/edit/delete
- spiel search
- spiel filtering
- copy spiel action
- role-based and department-based access

### Nice to Have

- audit logs
- archived spiel view
- duplicate spiel action
- recent spiels section
- favorite spiels

### Future Features

- browser extension
- one-click insert into active field
- approval workflow
- usage analytics
- version history
- import/export
- shared templates
- AI assistance

---

## 15. Future Browser Extension Requirement

Although not part of the first release, the product must be built so that:

- the same user can log in via future extension
- the same backend can serve both web app and extension
- the same permissions and data rules apply
- spiels can later be copied or inserted from the extension

This is a product-level requirement and affects the current system design.

---

## 16. Out of Scope for v1

The following are out of scope:

- Google OAuth
- Gmail OAuth
- multi-provider social login
- browser extension release
- AI-generated content
- approval workflow
- team collaboration comments
- external sharing
- advanced reporting
- template marketplace

---

## 17. Risks and Product Concerns

### Risk 1: Formatting inconsistency during paste

Pasting into external tools may behave differently across websites.

Mitigation:

- support both HTML and plain text output
- test common usage targets later

### Risk 2: Permission complexity

A user can belong to multiple departments, which increases access logic complexity.

Mitigation:

- keep access rules simple and department-based

### Risk 3: Low adoption if search is weak

If users cannot find spiels quickly, they may stop using the system.

Mitigation:

- prioritize simple and strong search/filter UX

### Risk 4: Extension support later may fail if architecture is weak

If backend design is too web-only, future extension support becomes harder.

Mitigation:

- keep architecture extension-ready from v1

---

## 18. Release Recommendation

### Phase 1

- authentication
- company / department / user structure
- category management
- spiel management
- rich text editor
- search and copy

### Phase 2

- usability improvements
- audit logs
- favorites / recent spiels
- archive handling

### Phase 3

- browser extension
- direct field insertion
- improved cross-platform use flow

---

## 19. Acceptance Criteria Summary

The product is acceptable for v1 if:

- users can sign up and log in with email/password
- admins can manage users and departments
- users can be assigned to multiple departments
- users can create and edit spiels
- spiels can be categorized
- users can search and filter spiels
- users can copy spiel content for reuse
- department-based permissions work correctly
- formatted spiel content is stored and reused properly
- product remains ready for future extension integration

---

## 20. Final PRD Summary

Spiel Vault is a structured spiel repository for teams.

It solves the problem of repeated manual messaging by providing:

- organized spiel storage
- department-based visibility
- category-based organization
- rich text support
- easy copy and reuse
- extension-ready product design

Version 1 focuses on building a clean and simple web application that employees and teams can start using immediately, while preparing the product for browser extension support in the next stage.
