# Design System Strategy: The Editorial Architect

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Digital Curator."**

Moving beyond the standard "B2B Dashboard" aesthetic, this system treats productivity as an editorial experience. It rejects the cluttered, line-heavy interfaces of legacy SaaS in favor of an expansive, high-contrast environment. We achieve a premium feel through **intentional asymmetry**—offsetting content blocks to create a rhythmic flow—and **tonal depth**, where hierarchy is defined by light and layering rather than structural boxes. This system is designed to make the user feel like an editor-in-chief of their own data, providing a workspace that is as authoritative as it is calm.

---

## 2. Colors & Surface Philosophy

Our palette utilizes "Trustworthy Blues" not as decorative accents, but as functional anchors.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. To create a premium, "limitless" feel, boundaries must be defined solely through background color shifts. For example, a main content area using `surface` should be distinguished from a sidebar using `surface-container-low`.

### Surface Hierarchy & Nesting

Treat the UI as a physical stack of fine paper. Use the following tiers to create "nested" depth:

- **Base Layer:** `background` (#f8f9fa) for the overall canvas.
- **Structural Zones:** `surface-container-low` (#f1f4f6) for sidebars or secondary navigation.
- **Actionable Containers:** `surface-container-lowest` (#ffffff) for primary cards or "Spiel" editors to make them pop against the base.
- **Overlays:** `surface-container-high` (#e3e9ec) for momentary UI like popovers or hover states.

### The "Glass & Gradient" Rule

To break the monotony of flat Material Design, use **Glassmorphism** for floating elements (e.g., search bars or command palettes). Apply `surface-container-lowest` at 80% opacity with a `backdrop-blur` of 12px.
**Signature Polish:** Use a subtle linear gradient on primary CTAs transitioning from `primary` (#005db5) to `primary-dim` (#0052a0) at a 135-degree angle. This adds "soul" and a tactile quality to the digital surface.

---

## 3. Typography

The system utilizes a dual-font strategy to balance editorial authority with functional utility.

- **Display & Headlines (Manrope):** We use Manrope for all `display` and `headline` levels. Its geometric yet warm curves provide a modern, bespoke feel. Large `display-lg` (3.5rem) type should be used with generous leading to anchor "Vault" sections.
- **Body & Labels (Inter):** Inter is our workhorse. It is optimized for the high-density text management required in a productivity tool.
- **Scale Intent:** Use `headline-sm` (#2b3437) for card titles to convey importance without bulk. Use `label-md` in `secondary` (#49636f) for metadata to ensure it recedes visually, allowing the "Spiel" content to remain the focus.

---

## 4. Elevation & Depth

In "The Digital Curator," we replace traditional drop shadows with **Tonal Layering.**

- **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural, soft lift.
- **Ambient Shadows:** For floating modals, use a "High-Diffusion" shadow:
- `X: 0, Y: 12, Blur: 32, Spread: -4`
- `Color: on-surface (#2b3437) at 6% opacity.`
- This mimics natural gallery lighting rather than a harsh digital glow.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a "Ghost Border": the `outline-variant` (#abb3b7) token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Cards & Lists (The Spiel Container)

- **Style:** No divider lines. Use `spacing-6` (1.5rem) of vertical white space to separate list items.
- **Interaction:** On hover, transition the background from `surface` to `surface-container-lowest` and apply a `radius-lg` (0.5rem).

### Buttons

- **Primary:** Gradient fill (`primary` to `primary-dim`), `on-primary` text, `radius-md`.
- **Secondary:** No fill. `primary` text. Use a `Ghost Border` (15% `outline-variant`) that becomes 40% on hover.
- **Tertiary/Icon:** `on-surface-variant` icons. No container unless hovered.

### Form Elements (The Editor)

- **Input Fields:** Use `surface-container-low` for the input track. No bottom line or border. On focus, transition to `surface-container-lowest` with a 1pt `primary` ghost-border.
- **Typography:** All user input should use `body-lg` to ensure "Spiel" creation feels substantial and legible.

### Sidebar Navigation

- **Layout:** A wide gutter using `surface-container-low`.
- **Active State:** Use a vertical "pill" indicator in `primary` (4px wide, `radius-full`) placed 8px away from the text, rather than highlighting the whole row.

---

## 6. Do's and Don'ts

### Do:

- **Do** use asymmetrical margins. If the sidebar is 280px, give the right-side content a 120px gutter to create an editorial feel.
- **Do** use `primary-container` (#d6e3ff) for subtle highlights in search results.
- **Do** group related actions (Edit/Copy/Share) into a single "floating" toolbar that appears only on hover to reduce visual noise.

### Don't:

- **Don't** use black (#000000) for text. Use `on-surface` (#2b3437) for better readability and a "ink-on-paper" feel.
- **Don't** use standard "Material" 1px dividers. If you need to separate sections, use a 8px height `surface-container-highest` block or simply more whitespace.
- **Don't** use aggressive rounding. Stick to `radius-md` (0.375rem) for most elements to maintain a professional, sharp architectural tone.
