# PLAN — OpenPCB UI refactor to the neutral EDA design (Claude Design handoff)

status: ready
owner: orchestrator session
branch: ui/neutral-eda-redesign
design bundle: /home/claude/repo/project (read-only source of truth)
design specs (extracted, exact px/hex): 
  - /tmp/claude-0/-home-claude-repo/caff7693-acd5-53e8-ac09-a6bfa2ebf24d/scratchpad/design-D2-pcb-schematic.md
  - /tmp/claude-0/-home-claude-repo/caff7693-acd5-53e8-ac09-a6bfa2ebf24d/scratchpad/design-D3-lib-bom-home.md
current-state recon (file:line, must-preserve lists):
  - .../scratchpad/recon-A1-shell.md, recon-A2-pcb.md, recon-A3-schematic.md, recon-A4-lib-bom-home.md
token source: /home/claude/repo/project/openpcb-theme.css

---

## 0. Goal and non-goals

Goal: re-skin and restructure the OpenPCB desktop frontend so the six screens in
`Compare Screens.dc.html` (2a PCB editor, 3a Schematic editor, 3b Library, 3c BOM,
3d Home, 2b Token sheet) match the handoff designs, **without changing behaviour**.
Every callback, store, hotkey, persisted key, DnD MIME contract, cross-probe path and
e2e accessible name listed in the recon files keeps working.

Non-goals (explicitly out of scope, recorded as follow-ups in §9):
- Canvas palette (schematic wire colours, PCB layer colours, selection colour inside
  WebGL canvases). Owned by external package `@openpcb/r3f-eda-canvas`
  (`OpenPCB-app/shared`); `EdaCanvas` wraps its own `CanvasThemeProvider(mode)`.
- Website (4a) — different repo.
- New product features the designs sketch but the backend does not support
  (multi-sheet "Sheets", design tags, recent-activity feed, ERC dock, DRC
  waive/severity, BOM "Group by", file "Open…" dialog). Rule in §2.D6.
- 3D view, Settings, Assistant space, Knowledge/Docs, Tasks, import wizard, dialogs:
  **token re-skin only** (they pick up new fonts/colours/radii via §3 T1), no
  structural changes.

## 1. Context (from Phase 1 recon)

- Stack: React 19, Vite 7, Tailwind v4 (CSS-only config in
  `src/core/frontend/src/index.css`: `@theme`, `@theme inline` semantic layer,
  `:root` light + `html.dark` dark, class-based dark via
  `@custom-variant dark (&:where(.dark, .dark *))`), lucide-react, Radix
  (tabs/tooltip/dialog/dropdown/context-menu/scroll-area), zustand, clsx +
  tailwind-merge via `cn()` in `src/core/frontend/src/lib/utils.ts`.
- Styling reality: 4,032 raw `slate-*` and 699 `violet-*` class usages across ~150
  TSX files; only ~80 uses of semantic tokens. Radii tokens today: card 14px,
  control 8px. Fonts: "Inter" declared but never loaded (system fallback).
- Shared primitives: `src/shared/frontend/ui/*` (button, card, chip, icon-button,
  pill, tabs, tooltip, textarea, stacked-card, dropdown-menu, context-menu,
  relevance-bar) — hand-rolled variant maps + `cn()`, no cva.
- Shell: `AppShell.tsx` = TitleBar (36px, Electron only) + `grid-cols-[80px_1fr]`
  (LeftSidebar 80px rail | main). Modules registered in rail: Designer, Library,
  Docs (id `knowledge`), Assistant; Home is a fixed first item; footer = bug link +
  Settings.
- Designer `Space.tsx` (1460 lines): DesignerHeader (44px, 3-col grid: DesignTabs |
  view Tabs schem/pcb/3d/bom/drc | trailing cloud+chat) → error strip → main flex
  row: [left sidebar (300 default, 240–520, not persisted) | resizer | canvas
  wrapper | resizer + Selection Inspector dock (schem, 260–440, persisted) |
  resizer + DRC dock (pcb, 280–560, persisted) | resizer + Chat dock (any, 320–560,
  persisted)]. PCB/DRC views append `DesignerStatusBar` (24px).
- PCB chrome is mostly rendered by `PcbCanvas.tsx` (~6000 lines): floating
  `PcbTopToolbar` (top-centre), floating `RouteHud`/`TuneHud`/`BundleHud`
  (bottom-centre), floating `PcbSelectionInspector` (top-right, free
  holes/pads/text only), and `PcbBoardPanel`/`PcbLayersPanel` **portalled** into
  `CollapsibleSection`s in `DesignerSidebar` via `pcbSlotRef`/`pcbLayersSlotRef`
  (sections stay mounted while collapsed; ids `pcb.sidebar.board`,
  `pcb.sidebar.layers` are localStorage keys). PCB selection lives inside
  PcbCanvas (`PcbSelection` sets); only `onSelectionCountChange` and
  `onViewportChange(zoom,x,y)` reach Space. `cursorMm` state exists inside
  PcbCanvas (line ~696) but is not surfaced.
- Schematic chrome: floating `DesignerFloatingToolbar` mounted by Space; docked
  `OutlinePanel` (Parts/Nets/Labels tabs, search, sortable columns) in the left
  sidebar; docked `SelectionInspector` (Part/Multi/Label/Wire panels) on the
  right; no status bar; no ERC UI (backend only).
- Library: header + `FacetSidebar` (w-60, checkbox facets Source/Family/Mount/
  Package/Other) + card grid (`LibraryCard` h-56); detail = full page swap to
  `ComponentDetailPage` (edit/clone/STEP upload/fullscreen previews live there).
  `LibraryCard` sets drag MIME `application/x-openpcb-library-component`.
- BOM: `DesignerBomView.tsx` two-pane `grid-cols-[minmax(0,1fr)_360px]`; CSS-grid
  table (checkbox | severity pill | Ref | Qty | Value | MPN·Source | Cost);
  severity stripe + tint per row; footer stats; `BomInspector` rail with 650ms
  debounced autosave; export menu.
- Home: `HomeScreen.tsx` centred column; chips All/Recent/Starred/Archived; search
  ⌘K; sort; grid/list toggle; `DesignCard` with `SchematicThumbnail`; `CloudSyncPill`
  ("Sign in to sync") next to "New design". DTO: id, name, revision, createdAt,
  updatedAt, schematicPreview, drcStatus — **no** board size / layer count / nets.
- Verification baseline (green at start): `cd src/core/frontend && npx tsc --noEmit
  --pretty false -p tsconfig.json` exit 0; `npm run test:react` 47 files / 326 tests.
  E2E (Playwright) exist but need a backend + browser; not run in this session —
  selectors preserved by rule (§2.D9).

## 2. Decisions (with rationale)

D1. **Token foundation = `openpcb-theme.css` dropped into `index.css`, plus a
compatibility layer.** Replace the `@theme` / `@theme inline` / `:root` /
`html.dark` blocks with the design's tokens (both themes). Keep the existing
semantic names alive as aliases so unmigrated files keep compiling and look
coherent: `--color-surface-card → surface-panel`, `--color-surface-card-hover →
surface-hover`, `--color-text-primary → text-strong`, `--color-accent →
selection`, `--color-accent-soft → selection-soft`, `--color-accent-text → text-strong`,
`--color-status-*-soft` (new soft values), `--radius-card → 2px`,
`--radius-control → 2px`, `--radius-float → 3px`, `--radius-pill → 999px`.
Additionally override Tailwind's own scales inside `@theme` so the ~150 untouched
files immediately lose the blue cast, violet accent and pill geometry:
  - `--color-slate-50…950` → neutral ramp (50 #f7f7f8, 100 #ececee, 200 #dcdce0,
    300 #c4c4c9, 400 #a8a8ad, 500 #7f7f84, 600 #55555a, 700 #2c2c31, 800 #1c1c1f,
    900 #111113, 950 #0c0c0d).
  - `--color-violet-50…950` → neutral "active" ramp (50 #f0f0f2, 100 #e4e4e7,
    200 #d0d0d5, 300 #a8a8ad, 400 #8a8a90, 500 #55555a, 600 #3a3a40, 700 #2c2c31,
    800 #1c1c1f, 900 #1c1c1f, 950 #151517).
  - `--radius-sm: 2px; --radius-md: 2px; --radius-lg: 2px; --radius-xl: 2px;
    --radius-2xl: 3px; --radius-3xl: 3px` (so `rounded-md/lg/xl/2xl` flatten;
    `rounded-full` stays round for dots/spinners).
  Rationale: one CSS file re-skins the whole app on day one; the five target
  screens are then migrated to semantic utilities properly; the remap is the
  documented stopgap for the rest (follow-up §9).
  Added semantic tokens the designs need (both themes): `surface-hover`
  (#1c1c1f / #e6e6e9), `surface-selected` (#26262b / #dcdce0), `surface-section`
  (= panel-head), `surface-canvas-well` (#08090a / #08090a), `text-caps` (#6a6a70 /
  #6f6f76), `border-control` (#2a2a2e / #cfcfd4), `primary` (#e8e8e8 / #111114),
  `primary-foreground` (#111114 / #f5f5f5), `status-*-soft` at 12% alpha.

D2. **Fonts bundled, not fetched.** Add `@fontsource/ibm-plex-sans` (400/500/600)
and `@fontsource/ibm-plex-mono` (400/500) to `src/core/frontend/package.json`; import
the weight CSS files in `main.tsx`. Electron runs offline; no Google Fonts.

D3. **Light theme stays.** `ThemeToggle`/`applyThemeClass` untouched; light values
come from `openpcb-theme.css`. Designs were only drawn dark; light is the token
sheet's light column.

D4. **Shared primitives are rewritten first** (T2) and new shared building blocks
added so screens share one vocabulary: `PanelSectionHeader`, `PropertyGrid`/
`PropertyRow`, `DataTable` helpers (`TableHeaderRow`, `TableRow`), `SegmentedControl`,
`SearchField`, `Checkbox`, `StatusDot`, `SeverityDiamond`, `DockTabs`, `StatusBar`/
`StatusSegment`, `ToolbarButton`/`ToolbarSeparator`. All in `src/shared/frontend/ui/`.
Exact px/hex per design-D2 §7 and design-D3 §5.

D5. **Docked chrome via portal slots, not prop-lifting.** `PcbCanvas` owns the
state the toolbar/HUDs/inspector need. Space.tsx renders empty slot `<div>`s
(toolbar row 30px, parameter row, layer tab strip 22px, right-dock Properties
body) and passes refs down exactly like the existing `pcbSlotRef`/`pcbLayersSlotRef`
pattern; PcbCanvas portals `PcbTopToolbar`, the HUDs, `PcbLayerTabStrip` and
`PcbPropertiesPanel` into them. Zero behavioural wiring changes; every prop stays.

D6. **Design elements without backing data are omitted, not faked.** No disabled
placeholders, no static demo rows. Concretely omitted: schematic "Sheets" section,
Home "Tags" group and "Recent activity", Home board-size/layers/nets columns,
Home "Open…" button, BOM "Group by" and "Unplaced" filter, DRC "Waive / Set
severity / Exclude type / Show waived" footer, schematic ERC dock tab and ERC
status segment, "Docs"-style items that don't exist. Where the *data* exists but
the *control* is new UI over existing actions (layer tab strip → `onSetActiveLayer`;
Home "Import KiCad…" → existing `KicadProjectImportWizard`), it is built.
(Confirm with user — Q1 in §8.)

D7. **One right dock per editor view, tabbed.** Replace the three sequential
right docks with a single `DesignerRightDock` (default 300px, resizable 260–560,
width persisted under new key `openpcb:designer:dock-width`; open state under
`openpcb:designer:dock-open`; active tab under `openpcb:designer:dock-tab`).
Tabs: PCB → Properties | DRC | Assistant; Schematic → Properties | Assistant;
3D → Assistant only; BOM/DRC full views → dock hidden (BOM has its own rail).
Migration: on first load read legacy keys (`chat-open`, `chat-width`,
`inspector-open`, `inspector-width`, `drc-width`) to seed the new ones. Hotkeys:
Cmd/Ctrl+I → open dock on Assistant; Cmd/Ctrl+. → toggle dock; DRC toolbar
button / status-bar DRC counter / `useDrcStore` open → dock on DRC tab. The
full-screen `drc` view tab is kept (design header has a DRC view tab).

D8. **PCB Properties tab content** (rendered by PcbCanvas into the dock slot):
- nothing selected → "Board" state: existing `PcbBoardPanel` content re-laid as
  property grid (Outline: shape/width/height + existing edit/draw/DXF/fit actions;
  Design rules row opens existing `PcbDesignRulesDialog`; Summary: parts count,
  nets/unrouted from workspace if available).
- one placement selected → Reference, Value, Footprint, Layer (side), X, Y,
  Rotation (read from projection; editable only where a dispatch command already
  exists: rotate/flip via existing actions), Pads table (# | net | size).
- free hole/pad/text selected → existing `PcbSelectionInspector` panels, restyled.
- multi → count + kinds.
The floating `PcbSelectionInspector` container goes away; its panel bodies move
into the dock.

D9. **E2E accessible names are frozen.** Buttons keep names: "Route (R)",
"Tune (U)…", "Bundle", "Board (O)…", "Flip part", "Undo", "Redo", "Fit schematic",
"Import outline", "Import DXF…", "Draw custom shape…", "Redraw shape…",
"Reset to rectangle", "New Design"/"New design", "Designer", "Library", "Edit",
"Preview…", "Link to Cloud…", "Open from Cloud…", "Import to local & open";
tabs "Schem"/"PCB"; headings "Designs", "Settings", "No design open"; label
"Settings"; texts "Route — click a pad to start", "Bundle — click 2+ pads to
collect…", "100% routed", "Untitled Design", "Custom shape", "Alternatives",
"Recommended", "Keep current placement", "Auto Layout applied"; testids
`pcb-route-board-button`, `pcb-autolayout-button`, `pcb-autoplace-button`,
`component-footprint-variants`, `component-mount-type`, `component-pad-count`,
`footprint-preview-canvas`. Icon-only buttons keep `aria-label`/`title` equal to
the old visible label.

D10. **Layout constants.** Rail 80px (unchanged). TitleBar 36px (unchanged).
Designer header 44 → 34px. Docked toolbar 30px. Parameter row 28px (only while
Route/Tune/Bundle active). Status bar 24 → 22px, shown for PCB, DRC **and**
schematic. Left panel default 260 (bounds 240–520 unchanged). Section headers
24px, list rows 22px, property rows 22px, BOM rows 24px, Home list rows 64px.

D11. **Library gets a table view with a sticky preview pane; the detail page stays.**
Table is the default; the existing card grid remains behind the Table/Grid toggle
(persist choice in localStorage `openpcb.library.view`). Selecting a row loads the
existing detail payload (`GET …/components/{id}/detail`) into a 380px preview pane
(symbol + footprint previews via existing `SymbolPreviewCanvas`/
`FootprintPreviewCanvas`, Part fields, Footprints with default badge, Pins,
Specs). "Open" / double-click → `ComponentDetailPage` unchanged (editing, clone,
STEP upload, fullscreen). Rows carry the same drag MIME/payload as `LibraryCard`.
Bulk selection/delete keeps working (checkbox column appears in selection mode).

D12. **BOM columns** → [checkbox 24px] [tier dot 28px] Designators | Value |
Footprint | Description | Qty | MPN | Unit | Ext. Severity map: `sourced` → Exact
(#6fbf7a), `suggested` → Suggested (#d9a441), `critical`/`review` → Missing
(#e0705f), `dnp` → neutral dot + strikethrough designators. Missing MPN renders
italic "Add part number" in danger colour. In-table totals row + 22px page footer.
Sourcing rail = property grid (Line / Sourcing / Alternates-if-data / Match tier
legend). All autosave/export/cross-probe logic untouched.

D13. **Home** → header 34px (title, count, search, List/Grid toggle, "Import
KiCad…", "New design" primary) | left sidebar 200px (All/Recent/Starred/Archived
rows with counts; footer "Local only — not signed in" + "Sign in to sync" =
relocated `CloudSyncPill` logic) | list table (Preview 220×52 thumbnail | Name +
path-less second line (created date) | Rev | DRC pill | Modified | ★) with 64px
rows | right detail panel 300px (large thumbnail, Design: Revision/Created/
Modified, Status: DRC, Open button, ActionsMenu) | footer bar 22px ("designs N",
"Local", app version). Grid view keeps restyled `DesignCard`. Sort dropdown kept.

D14. **Schematic** → docked 30px toolbar (existing tools, Fit keeps name "Fit
schematic"); left panel: Outline header (24px, count) + filter + segmented
Parts/Nets/Labels + column header + 22px rows; right dock Properties = existing
inspector panels restyled as property grids, idle state = "Sheet" summary
(symbols, nets, labels counts from projection; PCB sync row if
`pcbStale`/changes info exists); status bar (grid 2.54 mm, zoom, hint, selection).

D15. **Docs updated.** `docs/design/design-tokens.md` rewritten to the new system
(short, points at `index.css`), `docs/design/ui-backlog.md` gets a header note
that mockups predate the neutral redesign.

## 3. Task breakdown

Tiers: standard (Sonnet) · careful (Opus) · critical (Opus, xhigh review).
Dependency order: T1 ∥ T2 → wave {T3, T4a→T4b (one agent chain), T6, T7} → T5 → T8.
Execution rules (Phase 3 decision): NO worktrees. All agents edit the main checkout
on branch `ui/neutral-eda-redesign`, touch only their listed files, never run
`git add`/`git commit`; the orchestrator commits after review. Parallel agents may
see transient `tsc` errors from another agent's in-flight files — act only on errors
in your own files and say so in the report.

### T1 — Token foundation + fonts + docs [careful]
Files: `src/core/frontend/src/index.css`, `src/core/frontend/src/main.tsx`,
`src/core/frontend/package.json`, `package-lock.json`, `docs/design/design-tokens.md`,
`docs/design/ui-backlog.md`.
- Implement D1 (all tokens, aliases, slate/violet/radius remaps), D2, D15.
- Keep `.tiptap-is-empty` rule and `@source`/`@plugin`/`@custom-variant` lines.
- body: `font-family: var(--font-sans); font-size: 12px; font-variant-numeric:
  tabular-nums` (12px base, not 11 — app is denser than the 1440×900 mock and
  existing text-xs classes map to 11px via the scale).
VERIFY: `npm ci` ok; tsc clean; `npm run test:react` green; `npm run build:frontend`
succeeds; grep confirms no `#7c3aed`/`Inter` left in index.css.

### T2 — Shared UI primitives [careful]
Files: `src/shared/frontend/ui/*` (rewrite existing to token sheet; add
`panel-section-header.tsx`, `property-grid.tsx`, `data-table.tsx`,
`segmented-control.tsx`, `search-field.tsx`, `checkbox.tsx`, `status-dot.tsx`,
`severity-diamond.tsx`, `dock-tabs.tsx`, `status-bar.tsx`, `toolbar.tsx`), update
`index.ts` barrel (also export Tabs/ContextMenu).
- Existing exported prop APIs stay backward compatible (variants/tones may map to
  new looks; no removed props).
- Specs: design-D2 §3/§7/§9, design-D3 §5. Heights 22px, radius via tokens only,
  no raw palette classes in these files.
VERIFY: tsc; test:react; `grep -c "slate-\|violet-" src/shared/frontend/ui/*.tsx` = 0.

### T3 — App shell: rail, title bar, theme toggle, dialogs, scroll-area [standard]
Files: `AppShell.tsx`, `components/LeftSidebar.tsx`, `components/TitleBar.tsx`,
`components/ThemeToggle.tsx`, `components/AppContextMenu.tsx`, `components/ui/*`,
`screens/ModuleScreen.tsx`, `screens/SettingsScreen.tsx`, `settings/SettingsSidebar.tsx`
(settings: token classes only, no layout change).
Rail per design-D2 §2 (items 72px, active #1c1c1f r2 64px, icon 20 stroke 1.5,
label 10px). Keep aria-labels "Home", "Settings", module labels.
VERIFY: tsc; test:react; no `slate-|violet-` in touched files.

### T4 — Designer shell + PCB editor [critical] — run as T4a then T4b in one agent
T4a = `Space.tsx` + header/tabs/sidebar/status bar/empty state + new `DesignerRightDock`
+ portal slot divs + dock prefs migration. T4b = everything under `pcb/` portalled
into the slots. `ToolbarButton` must emit the exact former `title`/`aria-label`
strings (e.g. "Route (R)", "Board (O)", "Flip part", "Fit") — e2e locators depend on them.
Files: `Space.tsx`, `components/DesignerHeader.tsx`, `DesignTabs.tsx`,
`DesignerSidebar.tsx`, `CollapsibleSection.tsx`, `DesignerStatusBar.tsx`,
`DesignerEmptyState.tsx`, `DesignerPlaceholderView.tsx`, `DesignerDrcView.tsx`,
`CloudSyncBadge.tsx`, `CloudPresenceIndicator.tsx`; new `components/DesignerRightDock.tsx`;
`pcb/PcbCanvas.tsx` (mount points only), `pcb/PcbTopToolbar.tsx`, `pcb/RouteHud.tsx`,
`pcb/TuneHud.tsx`, `pcb/BundleHud.tsx`, `pcb/PcbLayersPanel.tsx`, `pcb/PcbBoardPanel.tsx`,
`pcb/PcbSelectionInspector.tsx` → `pcb/PcbPropertiesPanel.tsx` (new), new
`pcb/PcbLayerTabStrip.tsx`, `pcb/PcbSelectionFilter.tsx`, `pcb/PcbPlacePreviewBar.tsx`,
`pcb/PcbSideModeButton.tsx`.
Implement D5, D7, D8, D10 for PCB; header per design-D2 §3 (34px; view tabs with
2px underline; trailing Local/Cloud + dock toggle); toolbar docked per §4 (keep
existing tool set and order semantics; Route/Board/Add/DRC/View; Measure/Tune/
Bundle stay hotkey-only); parameter row per §5 hosts RouteHud/TuneHud/BundleHud
content (secondary rows for proposals/gate warnings render as an additional
28px row); Layers panel per §6 (rows 22px, swatch, friendly + KiCad hint, eye
toggle, Solo/Alt-click, Normal/Dim/Hide segmented, presets); layer tab strip
per §8 driven by active layer + `onSetActiveLayer`; status bar per §9 (surface
`cursorMm` via new optional `onCursorChange` prop; grid; zoom %; active layer;
hint; DRC counter; selection; view side; mm).
VERIFY: tsc; test:react; manual checklist in §6; localStorage migration unit test
for dock keys (add to `Space` neighbour test file if one exists, else
`stores/designer-dock-prefs.test.ts`).

### T5 — Schematic editor [careful] (worktree; depends on T4's dock + slots — run
after T4 merges, or in the same agent chain as T4)
Files: `components/DesignerFloatingToolbar.tsx` (→ docked row), `OutlinePanel/*`,
`SelectionInspector/*`, `LabelPicker.tsx`, `ComponentCommandPalette.tsx`,
`ComponentClassIcon.tsx`, schematic branches in `Space.tsx`.
Implement D14. Keep every hotkey, selection nonce sync, DnD MIME, context menus.
VERIFY: tsc; test:react; §6 checklist.

### T6 — Library [careful] (worktree, parallel with T4)
Files: `src/modules/library/frontend/Space.tsx`, `LibraryCard.tsx`, new
`components/LibraryTable.tsx`, new `components/LibraryPreviewPane.tsx`,
`components/FacetSidebar.tsx`, `ActiveFilterChips.tsx`, `TagChip.tsx`,
`TagFilterChips.tsx`, `TagTokenInput.tsx`, `DetailsCard.tsx`, `FootprintOptionsList.tsx`,
`PinsTable.tsx`, `PreviewModal.tsx`, `ComponentDetailPage.tsx` (token re-skin +
2px radii; layout unchanged), `CloudLibrarySyncButton.tsx`.
Implement D11; specs design-D3 §2.
VERIFY: tsc; test:react (incl. `ComponentDetailPage.test.ts`); §6 checklist.

### T7 — BOM + Home [careful] (worktree, parallel with T4)
Files: `components/DesignerBomView.tsx`; `screens/HomeScreen.tsx`,
`screens/home/DesignCard.tsx`, `screens/home/SchematicThumbnail.tsx`, new
`screens/home/HomeSidebar.tsx`, `screens/home/DesignListRow.tsx`,
`screens/home/DesignDetailPanel.tsx`.
Implement D12, D13; specs design-D3 §3–4.
VERIFY: tsc; test:react (`schematic-preview.test.ts`); §6 checklist.

### T8 — Integration, sweep, verification [orchestrator + reviewer agents]
Merge worktrees, resolve conflicts, run full VERIFY, grep sweep for leftover
`violet-`/`rounded-xl`/`rounded-2xl`/`rounded-full` on non-circular elements in
touched files, run `npm run build:frontend`, write Run log.

## 4. Interfaces

```ts
// src/modules/designer/frontend/components/DesignerRightDock.tsx
export type DockTab = "properties" | "drc" | "assistant";
export interface DesignerRightDockProps {
  tabs: ReadonlyArray<{ id: DockTab; label: string; badge?: number | string }>;
  activeTab: DockTab;
  onTabChange: (t: DockTab) => void;
  width: number;                       // clamped 260–560 by owner
  onResizeStart: (e: React.PointerEvent) => void;
  onClose: () => void;
  children: React.ReactNode;           // body for activeTab
}

// Space.tsx → PcbCanvas (new optional props; portal slots)
pcbToolbarSlotRef?: React.RefObject<HTMLDivElement | null>;
pcbParamRowSlotRef?: React.RefObject<HTMLDivElement | null>;
pcbLayerStripSlotRef?: React.RefObject<HTMLDivElement | null>;
pcbPropertiesSlotRef?: React.RefObject<HTMLDivElement | null>;
onCursorChange?: (pt: { xMm: number; yMm: number } | null) => void;
onActiveLayerChange?: (layer: PcbLayerId) => void;   // for status bar chip

// shared/ui additions (all accept className, forward refs where sensible)
PanelSectionHeader({ title, count?, trailing?, collapsed?, onToggle? })
PropertyGrid({ children })  PropertyRow({ label, mono?, hint?, children })
TableHeaderRow({ cols: string /* grid-template-columns */, children })
TableRow({ cols, selected?, onClick?, ... })
SegmentedControl<T>({ options: {id:T; label; icon?}[], value, onChange, size? })
SearchField({ value, onChange, placeholder, shortcutHint?, ... })
Checkbox({ checked, onChange, label?, indeterminate? })
StatusDot({ tone }) SeverityDiamond({ severity: "error"|"warning"|"info" })
DockTabs({ tabs, active, onChange })
StatusBar({ children }) StatusSegment({ children, flex?, mono? })
ToolbarButton({ icon, label, hotkey?, active?, disabled?, onClick, ... }) ToolbarSeparator()
```

## 5. Edge cases and failure modes

- Light theme: every new token has a light value; run the app with `.dark` removed
  once per screen (manual).
- Electron title bar: `TitleBar` only renders under Electron; rail must not assume it.
- Persisted keys: `pcb.sidebar.board`, `pcb.sidebar.layers`, `openpcb.designer.tabs.v1`,
  `openpcb:designer:recents`, `openpcb.home.starred/archived` untouched; dock keys
  migrated (D7).
- Portal slots: slot `<div>`s must exist before PcbCanvas mounts its portals; guard
  with `slotRef.current && createPortal(...)` and re-render on ref availability
  (existing pattern in PcbCanvas for sidebar slots — copy it).
- The parameter row must not steal keyboard focus from the canvas; inline editors
  keep their Enter/Escape/blur contract (recon-A2 §10).
- Library table with 60+ rows: no virtualization today; keep rows cheap (no
  per-row preview canvases — glyph only).
- BOM `checkedIds` bulk DNP requires the checkbox column to remain.
- `LibraryCard` drag payload duplicated into table rows — share one helper.
- Reduced-motion / `backdrop-blur` removed with floating chrome (docked panels
  are opaque).

## 6. Manual verification checklist (run phase, per screen, both themes)

PCB: open design → PCB tab; toolbar docked, Route toggles parameter row, Esc
exits; select footprint → Properties fills; click empty → Board state; DRC button
→ dock DRC tab, row click centres canvas; layer strip click → active layer
changes in Layers panel + status bar; Cmd/Ctrl+I → Assistant tab; Cmd/Ctrl+. →
dock toggles; reload → dock width/tab restored; Layers eye toggles work; Alt+click
solo works; status bar shows cursor X/Y while moving.
Schematic: toolbar docked, ⌘K palette, G/P/H place, outline row click selects on
canvas, F2 rename, inspector edits value, "View on PCB" cross-probes, status bar
zoom updates.
Library: table default, facets filter rows, row click fills preview, double-click
opens detail page, Edit/Save/Clone still work, drag row to schematic places part,
Grid toggle shows cards, selection-mode bulk delete.
BOM: rows/tiers render, row click fills rail, edit MPN autosaves ("Saved"),
DNP checkbox, Show in schematic/PCB, Export CSV, totals correct.
Home: list default with thumbnails, ★ toggles persist, filters/counts, search
⌘K, N creates design, delete flow, "Sign in to sync" in sidebar footer opens
Settings → Account, grid toggle.

## 7. Verification commands

```
cd /home/claude/openpcb
npx tsc --noEmit --pretty false -p src/core/frontend/tsconfig.json    # exit 0
npm run test:react                                                     # all green
npm run build:frontend                                                 # succeeds
grep -rnE "(bg|text|border|ring)-(violet|purple|indigo)-" <touched files>   # 0 hits
```

## 8. User decisions (answered 2026-09-05, before run)

Q1. Unsupported design elements → **omit** (D6 stands).
Q2. Library → **table + preview pane, keep detail page** (D11 stands).
Q3. Delivery → **push branch and open a PR** at the end.
Q4. Execution → **Agent waves** (≤4 concurrent implementers), no Workflow.

## 9. Follow-ups (not in this run)

- Canvas palette in `OpenPCB-app/shared` (`canvasTheme.ts` SCHEMATIC_DARK, PREVIEW_DARK,
  PCB_CANVAS_TOKENS, PCB_LAYER_COLORS/PCB_TRACE_COLORS) → design values in
  design-D2 §10 and `openpcb-theme.css` layer palette; then bump the dep.
- Migrate remaining ~100 files from remapped `slate-*`/`violet-*` to semantic tokens
  (Assistant, Knowledge, Settings panels, import wizard, autolayout dialogs, 3D).
- ERC frontend (dock tab + status segment) once an ERC API exists.
- Design tags, activity feed, board metadata in `DesignerDesignSummary` for Home.
- Website (4a) in `OpenPCB-app/web`.
- Dead code noticed: `OutlineGroup.tsx` unused, `SortableTh` in BOM unused,
  `gridVisible` prop on the schematic toolbar unused, Comment "(C)" hotkey not wired.

## Run log
(empty — filled by Phase 4)
- 2026-09-05 T1 tokens/fonts/docs — reviewed (index.css read in full, tsc 0, 326 tests, build ok) — committed ab0c0f4.
- 2026-09-05 T2 shared primitives — reviewed (toolbar/data-table/dock-tabs/status-bar/property-grid/button read; additive API only; tsc 0) — committed ea10c37.
- 2026-09-05 wave 2 launched: T3 (sonnet), T4 (opus, critical), T6 (opus), T7 (opus) in the main checkout, no worktrees.
- 2026-09-05 T3 app shell — reviewed (rail/title bar diffs read; tsc 0) — committed a2e5265.
- 2026-09-05 T7 BOM + Home — reviewed (HomeSidebar, layout, BomRow read; "New design" markup unchanged for e2e) — committed 186c592. Omitted for lack of data: BOM Description/Stock, Home Import KiCad/version/tags/activity.
- 2026-09-05 T6 Library — reviewed; fixed inline: e2e specs now open components via `library-component-row-*` + dblclick (table is default); card preview SVG pinned to theme=dark (wells are always dark) — committed fa3e098.
- 2026-09-05 FINDING: root `npm run typecheck` (tsc -b) fails on `master` too (36 pre-existing errors in assistant/**, library/backend/**, core/backend/tests — `AiProviderKind` lacks "openpcb-cloud"). Gate for this branch = no NEW errors: `tsc -p tsconfig.modules.json` filtered to designer/library/shared/core frontend must be empty, plus frontend tsc + vitest + build.
- 2026-09-05 T4 designer/PCB — critical review by reviewer agent + own read. Fixed before commit: cursor readout moved to `pcb-cursor-store` (Space re-rendered per pointer move); DRC full view height/scroll; selection opens a closed dock and never leaves Assistant; single trace/via selection state; "Fit board" name; ToolbarButton `title` override (Undo/Redo hotkey tooltips) — committed 0ef7b65. Deferred to T8a: dead PcbTopToolbar props, `boardPanelTarget`, raw palette classes in PcbCanvas overlays. Note: `pcb.sidebar.board` localStorage key is now unused (Board moved to the Properties dock).
- 2026-09-05 launched T5 (opus) + T8a PCB cleanup (sonnet).
