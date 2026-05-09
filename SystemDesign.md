# Startup Compass — system design

This document matches the **home page** (`LandingAtlasPage`): Utah flag–inspired chrome, cream field, black typography, and **gold** rules. Use these tokens everywhere so marketing, tools, and map surfaces feel like one product.

## Color tokens (CSS)

Defined in `src/app/globals.css` (`:root` and `@theme inline`). Prefer Tailwind utilities that map to these variables.

| Token | Hex / value | Role |
|--------|-------------|------|
| `--ink` | `#0a0a0a` | Primary body text |
| `--ink-soft` | `#1a1a1a` | Secondary text |
| `--ink-mute` | `#333333` | Tertiary / meta text |
| `--surface` | `#ffffff` | Default background |
| `--surface-elev` | `#ffffff` | Cards / elevated panels |
| `--surface-tint` | `#faf8f5` | Warm cream tint, chips, subtle fills |
| `--gold` | `#d4af37` | Headlines (hero), borders, focus, accents |
| `--gold-hover` | `#b8962e` | Gold hover (if needed) |
| `--gold-soft` | `#fff9e6` | Light gold wash for selected states |
| `--utah-blue` | `#0c2856` | **Header bar only** (and rare primary fills aligned with flag) |
| `--utah-blue-hover` | `#081d40` | Darker blue for filled button hover |
| `--utah-red` | `#bf0a30` | Footer field, destructive / pulse CTA variant |
| `--rule` | `rgba(212, 175, 55, 0.55)` | Default hairlines / card borders |
| `--rule-strong` | `#d4af37` | Stronger gold border |
| `--focus` | `#d4af37` | `:focus-visible` outline |

**Avoid** using Tailwind `accent` / `text-accent` / `bg-accent` for product chrome—they map to legacy blue (`#0f62c9`). Prefer **`text-gold`**, **`text-ink`**, **`border-gold`**, **`bg-utah-blue`**, **`bg-gold-soft`**. The `--accent` CSS variables remain in `globals.css` for backward compatibility only.

Tailwind: `text-ink`, `text-gold`, `border-rule`, `border-gold`, `bg-utah-blue`, `bg-utah-red`, `bg-surface-tint`, `accent-gold` (checkboxes), etc. (see `@theme inline`).

## Layout shells

| Class | Use |
|--------|-----|
| `atlas-page atlas-page-light` | Default app pages: cream radial wash, black text |
| `atlas-header` | Sticky nav: Utah blue, white type, gold bottom border, gold active indicator |
| Footer (`Footer.tsx`) | Utah red, white type, gold section rules |

Do **not** use a separate “dark” page theme for marketing-style pages; map internals may keep their own dark panels for contrast on the map.

## Typography

- **Sans:** Inter (`--font-inter`)
- **Display / headlines:** Fraunces (`--font-fraunces`) — `font-display`
- **Hero H1:** Gold, display font, black `-webkit-text-stroke` for readability on photography (no filled box)
- **Page / section titles:** Gold, centered where the home hero pattern applies
- **Body:** Black (`ink` family), never light-on-cream gray-blue for primary copy

## Buttons (home patterns)

| Pattern | Class / notes |
|---------|----------------|
| Primary | `.atlas-btn-primary` — Utah blue fill, **gold** `2px` border, white label |
| Secondary / outline | `.atlas-btn-ghost` — white/cream fill, **gold** border, black label |
| Pulse / emphasis | `.atlas-btn-red` — Utah red fill, gold border, white label |

## Borders & interaction

- Default card / list outlines: **`border-rule`** or **`border-gold`** (2px on key cards like metrics strip)
- Hover: deepen border with **`border-rule-strong`** or **`border-gold`**, not bright blue
- Links in content: **ink** + underline; avoid blue link color
- Focus: **gold** ring / outline (`--focus`)

## Icons & chips

- Icons on light backgrounds: **`text-ink`** (or **`currentColor`** inherited from ink)
- Selected / active chips: **`border-gold`**, **`bg-gold-soft`** or **`bg-surface-tint`**, **`text-ink`**

## When Utah blue appears outside the header

Use **`bg-utah-blue`** + white text only for **primary actions** that should mirror the flag blue (same family as `.atlas-btn-primary`), not for inline links or labels.

## Checklist for new UI

1. Page wrapper: `atlas-page-light` + `AtlasHeader` (+ `Footer` via layout where applicable).
2. No `text-accent` / `border-accent` for brand surfaces—use **gold** + **ink**.
3. Primary CTA: Utah blue + gold border or `.atlas-btn-primary`.
4. Body text: **ink** scale on cream/white only.

---

*Last updated to align with the home page and Utah flag palette (navy header, red footer, gold rules, black type).*
