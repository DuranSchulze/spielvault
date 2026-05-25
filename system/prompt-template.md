# Prompt Template — Codebase Research & Planning System

> **Purpose:** A reusable prompt pattern for analyzing a codebase, identifying issues, and building a structured plan system.
> **Source:** This was derived from the actual task that created `system/CHECKLIST.md`, `system/01-codebase-research.md`, `system/02-issues-enhancements.md`, and all 22 plans under `system/plans/`.
> **Usage:** Copy and adapt this template when you need to repeat this workflow on a new project or feature set.

---

## The Prompt Pattern

Below is the structured instruction template. Variables in `{{double braces}}` should be replaced for your context.

---

```
## Phase 1: Scan & Research

I want you to scan the codebase or the project. I want you to understand its functions, goals, and idea — why it was built, everything you can get.

Put detailed research findings into a folder called `system/` and a filename specific for our research findings.

## Phase 2: Analyze & Diagnose

Then analyze the codebase — spot errors in the coding and possible growth for its enhancements.

## Phase 3: Build a Planning System

Create a PRD/plan system inside `system/` structured as follows:

1. **A checklist file** (`CHECKLIST.md`) — The master list of all planned features, fixes, and enhancements. Each checklist item points to a folder containing detailed specs.
2. **Individual plan folders** (`plans/<id>-<slug>/README.md`) — Each checklist item gets its own folder with a detailed breakdown.
3. **A prompt template** (`prompt-template.md`) — Documenting how I laid out this task so it can be reused as a skill or future prompt.

### Checklist File Requirements

- Each item should link to its corresponding plan folder
- Include comments in the file so that in the future, new features or plans can be added to the checklist easily
- Categorize items by priority (Critical / Medium / Minor / Future)
- Include a progress summary table

### Plan Folder Requirements

Each plan's `README.md` should include:
- What needs to be achieved
- Why (the problem it solves)
- Current state of the codebase related to this plan
- Requirements checklist
- Implementation approach (with code snippets where helpful)
- Files affected table (file + type of change)
- Dependencies on other plans
- Acceptance criteria (checklist items to mark done)

### On Completion

When a checklist item is completed, add a `SOLUTION.md` inside the plan's folder documenting:
- What was actually implemented (vs what was planned)
- Any deviations from the original plan
- Key files created or modified
- Decisions made during implementation
- Anything to watch out for in future changes

Then mark the item `[x]` in `CHECKLIST.md` and update the Progress Summary table.

## Phase 4: Output

Return the full structure with all files created and a summary of what was built.
```

---

## Example: The Actual Task That Generated This System

The instructions that produced the current `system/` folder were:

1. **"Scan the codebase, understand its functions and goals… put detailed findings in a folder called system with a filename specific for our findings."**
   → Produced `system/01-codebase-research.md`

2. **"Analyze the codebase, spot errors and possible growth for enhancements."**
   → Produced `system/02-issues-enhancements.md`

3. **"Create a PRD plan for it inside system/. A breakdown plan with a checklist file, each checklist item points to a folder carrying a file about the checklist. Add comments in the checklist file. Add also a prompt template."**
   → Produced `CHECKLIST.md`, 22 plan folders under `plans/`, and this file.

---

## Best Practices for This Workflow

| Step | Tip |
|---|---|
| **Scanning** | Read every file in a structured order: docs → config → schema → pages → components → lib → API routes. Don't skip anything — one overlooked file can change your understanding. |
| **Issue Identification** | Group by severity (🔴 breaks functionality / 🟡 blocks growth / 🟢 polish). Always reference exact file paths and line numbers. |
| **Checklist Design** | Keep numbering sequential. Add HTML comments at the top explaining how to add new items. Include a progress table. |
| **Plan Specs** | Balance detail vs. brevity. Critical/Medium items need implementation code. Future items can be lighter. Always include acceptance criteria. |
| **Prompt Capture** | Document the exact instructions that produced the work so it can be re-executed. Note any corrections the user made. |

## Customization Notes

- **Severity labels:** Customize 🔴🟡🟢🚀 to match your team's conventions
- **Plan template sections:** Adjust if your team prefers ADRs (Architecture Decision Records) or RFC-style specs
- **Checklist location:** You may prefer `docs/plans/` instead of `system/plans/` depending on your repo conventions
- **Folder numbering:** Use zero-padded numbers (`01-`, `02-`) for natural sort order in file explorers
