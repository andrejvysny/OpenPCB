# Design tokens

> Rewritten 2026-09-05 for the neutral EDA redesign. This document describes the system;
> the **values live in one place**: `src/core/frontend/src/index.css`. If a value here and
> a value there disagree, `index.css` wins — fix this file.

The UI is chrome for an EDA tool: dense, neutral, low-chroma, so that saturated canvas
artwork (copper layers, net colours, DRC markers) is the only thing that draws the eye.

**Where tokens live.** `index.css` has four blocks:

1. `@theme` — theme-invariant primitives: fonts, type scale, radii, rhythm, canvas and
   layer palette, plus the Tailwind scale remaps (see §6).
2. `@theme inline` — semantic `--color-*` names mapped to `var(--…)`, so utilities such as
   `bg-surface-panel` resolve per theme.
3. `:root` — light values for every raw variable.
4. `html.dark` — dark values. Dark mode is class-based (`@custom-variant dark`).

Consume tokens through Tailwind utilities (`bg-surface-panel`, `text-text-secondary`,
`border-border-subtle`, `rounded-control`) — not raw hex, and not `slate-*`/`violet-*`.

---

## 1. Semantic tokens

| Group | Tokens |
|---|---|
| Surfaces | `surface-app`, `surface-rail`, `surface-panel`, `surface-panel-head`, `surface-section`, `surface-raised`, `surface-control`, `surface-input`, `surface-hover`, `surface-selected`, `surface-canvas-well` |
| Lines | `border`, `border-subtle`, `border-control`, `divider` |
| Text | `text-strong`, `text`, `text-secondary`, `text-tertiary`, `text-disabled`, `text-caps` (uppercase micro-labels) |
| Action | `primary`, `primary-foreground` — neutral, not chromatic |
| Selection | `selection`, `selection-soft` |
| Status | `status-danger`, `status-warning`, `status-success`, `status-info`, `status-neutral`, each with a `-soft` 12–14% fill |
| Net classes | `net-power`, `net-ground`, `net-signal`, `net-bus` |
| Canvas (invariant) | `canvas`, `canvas-board`, `canvas-grid`, `canvas-grid-major`, `canvas-axis`, `canvas-ratsnest`, `canvas-refdes`, `canvas-pad-number` |
| Layers (invariant) | `layer-f-cu`, `layer-in1-cu`, `layer-in2-cu`, `layer-b-cu`, `layer-f-silks`, `layer-b-silks`, `layer-f-mask`, `layer-b-mask`, `layer-f-paste`, `layer-b-paste`, `layer-f-crtyd`, `layer-b-crtyd`, `layer-edge-cuts`, `layer-drill`, `layer-metadata`, plus `--opacity-copper` |

Status, layer and net-class colours are three **non-overlapping** families: a colour never
means "error" in one place and "bottom copper" in another.

## 2. The accent rule

**Violet is retired.** Chrome is neutral greys. The single chromatic accent is the
selection colour — `#33d1ff` cyan in dark, `#0891b2` in light — and it is used **only** for
selection, focus rings and net highlight. Primary buttons are neutral (`primary` /
`primary-foreground`), not coloured.

## 3. Light and dark

Every semantic token has both values. Light is not an afterthought: the designs were drawn
dark, but `:root` carries the full light column and each screen must be checked with the
`.dark` class removed. Only the canvas and layer palettes are theme-invariant — the PCB
canvas is always dark, because the layer palette is chosen against black.

## 4. Type scale

| Token | Size / line-height | Typical use |
|---|---|---|
| `text-2xs` | 10 / 14 | uppercase micro-labels, status bar |
| `text-xs` | 11 / 15 | table rows, property values, most chrome |
| `text-sm` | 12 / 16 | body default |
| `text-base` | 13 / 18 | panel titles |
| `text-lg` | 15 / 20 | screen headings |
| `text-xl` | 20 / 26 | empty states |

Fonts are **IBM Plex Sans** and **IBM Plex Mono**, bundled via `@fontsource` and imported in
`main.tsx` — Electron runs offline, so nothing is fetched from Google Fonts. Mono is
semantic: it marks a machine identifier (refdes, MPN, net name, coordinate). `body` sets
12px and `font-variant-numeric: tabular-nums` globally so columns of numbers align.

## 5. Radii and rhythm

Radii: `radius-none` 0 (docked panels, rows, tabs), `radius-control` 2px (buttons, inputs,
chips), `radius-float` 3px (menus, tooltips, HUDs), `radius-pill` 999px (status pills only).
`radius-card` is kept at 2px as a compatibility alias.

Rhythm (`--spacing-*`, usable as `h-row`, `h-toolbar`, …): `row` 22px, `row-lg` 26px,
`panel-head` 24px, `toolbar` 30px, `tabbar` 34px, `statusbar` 22px, `rail` 80px.

## 6. Compatibility layer (stopgap — remove it)

The redesign lands on a codebase with ~4,000 `slate-*` and ~700 `violet-*` class usages.
Two shims keep those files coherent until they are migrated:

- **Aliases** in `@theme inline`: `surface-card` → `surface-panel`, `surface-card-hover` →
  `surface-hover`, `text-primary` → `text-strong`, `accent` → `selection`, `accent-soft` →
  `selection-soft`, `accent-text` → `text-strong`, plus the `status-*-soft` and `net-*`
  names that predate this system.
- **Tailwind scale remaps** in `@theme`: `--color-slate-50…950` becomes a neutral grey ramp,
  `--color-violet-50…950` becomes a neutral "active" ramp, and `--radius-sm/md/lg/xl` are
  flattened to 2px with `2xl/3xl` at 3px (`rounded-full` still rounds, for dots and
  spinners).

Both are **documented stopgaps**, not API. New code uses the semantic names. The remaining
migration (Assistant, Knowledge, Settings, import wizard, 3D) is tracked as a follow-up; when
it lands, delete the remaps.

## 7. Canvas palette

The `canvas-*` and `layer-*` tokens above are the design's values, but the 2D/3D canvases do
**not** read them yet: the renderer palette is owned by the external package
`@openpcb/r3f-eda-canvas` (`canvasTheme.ts` — `SCHEMATIC_DARK`, `PREVIEW_DARK`,
`PCB_CANVAS_TOKENS`, `PCB_LAYER_COLORS`, `PCB_TRACE_COLORS`), and `EdaCanvas` wraps its own
`CanvasThemeProvider(mode)`. Aligning that package with these values, then bumping the
dependency, is a follow-up.
