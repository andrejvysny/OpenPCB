# UI backlog

> **Predates the neutral EDA redesign (2026-09).** The mockups and token values
> referenced below describe the old violet-on-slate look, not the shipped chrome.
> Where this file and [`design-tokens.md`](design-tokens.md) disagree, design-tokens.md wins.

> Source note: this backlog was distilled from a UI/UX review that took place as a chat
> transcript against screen mockups. **The mockups survive.** They are preserved under
> [`mockups/`](mockups/): 13 standalone HTML mockups, plus the 17 PNG captures the review was
> conducted against (`image.png`, `image-1.png` … `image-16.png`). Every item below is still
> written in words and is self-contained — you can act on it without opening anything — but
> where an item has a corresponding mockup, the mockup is linked, and it is the faster way to
> see the intended result.

Everything below is **open work**. Nothing here is described as shipped. Items that are blocked
say what they are blocked on. Where the review offered an opinion without evidence, the item
records the reasoning rather than the verdict.

## Mockup index

The HTML mockups are self-contained pages — open them directly in a browser. They are design
intent, not shipped UI, and they predate several of the resolutions recorded below; where a
mockup and this document disagree, **this document wins**.

| Mockup | Surface it shows | Backlog section |
|---|---|---|
| [`openpcb_home_screen_redesign_v1.html`](mockups/openpcb_home_screen_redesign_v1.html) | Designs dashboard with search, sort, per-card menu and board thumbnails | §1 |
| [`openpcb_schematic_editor_redesign_v1.html`](mockups/openpcb_schematic_editor_redesign_v1.html) | Schematic canvas, outline panel and label placement | §2 |
| [`openpcb_pcb_editor_redesign_v1.html`](mockups/openpcb_pcb_editor_redesign_v1.html) | PCB editor shell and layer panel | §11 (and the rendering rules in `docs/designer/pcb-layer-rendering.md`) |
| [`openpcb_3d_view_redesign_v1.html`](mockups/openpcb_3d_view_redesign_v1.html) | 3D view with the populated left panel, camera presets and the enclosure card | §4 |
| [`openpcb_bom_redesign_v1.html`](mockups/openpcb_bom_redesign_v1.html) | BOM table with severity tiers and the cost preview | §5 |
| [`openpcb_settings_assistant_redesign_v2_stacked.html`](mockups/openpcb_settings_assistant_redesign_v2_stacked.html) | Assistant settings as stacked cards — the pattern in §10, applied | §7, §10 |
| [`openpcb_assistant_chat_interface_v2.html`](mockups/openpcb_assistant_chat_interface_v2.html) | Full-width assistant chat surface | §8 |
| [`openpcb_assistant_chat_shell_markdown_tools_v1.html`](mockups/openpcb_assistant_chat_shell_markdown_tools_v1.html) | Chat shell: markdown rendering and tool-call blocks | §8 |
| [`openpcb_assistant_component_cards_v1.html`](mockups/openpcb_assistant_component_cards_v1.html) | Component result cards in chat — the compact form the library grid is measured against | §6 |
| [`openpcb_assistant_bom_placement_diagram_v1.html`](mockups/openpcb_assistant_bom_placement_diagram_v1.html) | BOM and placement proposals rendered as diagram cards | §5 |
| [`openpcb_assistant_schematic_placement_v2.html`](mockups/openpcb_assistant_schematic_placement_v2.html) | Schematic placement proposal cards | §2 |
| [`openpcb_assistant_mermaid_showcase_v1.html`](mockups/openpcb_assistant_mermaid_showcase_v1.html) | Mermaid diagram rendering inside chat | §8 |
| [`openpcb_docked_chat_panel_v2.html`](mockups/openpcb_docked_chat_panel_v2.html) | Docked chat panel, two-row header, narrow-width card reflow | §8 |

The PNGs are the review's own captures of the application as it stood, and are the evidence for
the defects described below rather than proposals for fixing them.

---

## 1. Home — designs dashboard

Mockup: [`openpcb_home_screen_redesign_v1.html`](mockups/openpcb_home_screen_redesign_v1.html).

The dashboard is clean but low-density: about three lines of information in a card occupying
roughly a tenth of the viewport. It works at four designs and breaks at fifty. Users migrating
from a file-based EDA tool scan dozens of projects.

| Item | Notes |
|---|---|
| Search field | Filter designs by name. The prerequisite for every other item here. |
| Sort control | By modified, created, or name. Default to modified. |
| Three-dot menu per card | Rename, duplicate, export, delete. Today it is unclear whether the whole card is the open target and there is no secondary-action affordance at all. |
| Board thumbnails | A rendered PCB top view on each card. **Visual recognition beats text recognition** for finding an old project — this is the single largest "looks like a real product" upgrade the dashboard can get. Largest effort item in this section. |
| Drop the subtitle | "Manage your PCB designs" restates the page title. |

Deferred, recorded for completeness: a list/grid toggle, and filter chips for recent / starred /
archived.

---

## 2. Schematic editor

Mockups: [`openpcb_schematic_editor_redesign_v1.html`](mockups/openpcb_schematic_editor_redesign_v1.html)
for the canvas and outline panel;
[`openpcb_assistant_schematic_placement_v2.html`](mockups/openpcb_assistant_schematic_placement_v2.html)
for assistant-proposed placement.

### 2.1 Label collisions — the highest-priority visual defect

Text collides with symbol geometry in several ways at once: net labels overlap IC pin numbers,
pin-name labels collide with connector footprint rectangles, and pin numbers render on top of a
diode's symbol body.

This is the most "amateur" tell in the application. A user arriving from a mature EDA tool sees
overlapping label text and concludes the rendering engine is incomplete, which colours their
reading of everything else.

The fix is collision-aware label placement: detect overlap between a label's bounding box and
nearby symbol geometry or other labels, and offset along the permitted axes. This is a real
algorithm with prior art in the graph-drawing literature, not a nudge to a constant.

### 2.2 Alphanumeric outline sort

The outline panel lists components in insertion order. It must default to **alphanumeric sort by
designator** — C1, D1, D2, J1, R1…R6, U1 — which is the standard convention in every EDA tool
the target user has used.

Cheap, and it removes the impression that the list is unordered.

### 2.3 Smaller outline issues

- Component names truncate (`NE555 Tim…`) at a sidebar width that could fit them.
- The designator / value / footprint row is dense and has no column headers, so a first-time
  user cannot tell which field is which.

### 2.4 Canvas

- No visible grid. Schematic placement comprehension depends on one.
- No empty state. A design with zero components gives the user nothing to act on, and it is
  ambiguous whether the canvas is empty or the feature is unfinished.

---

## 3. Export modal

The copy in this modal is genuinely good — it states the bundle contents in concrete terms and
tells the user what to do with the result. The gaps are state-awareness, not language.

| Item | Notes |
|---|---|
| Disable the inner-copper-layer checkbox on a 2-layer board | It currently renders enabled on a board that has no inner layers. Grey it out with a tooltip explaining that a 4-layer board is required. State-aware UI. |
| Filename preview | Show the resulting archive name above the download action, e.g. `Dual_LED_Blinker_r59.zip`. Users need to know what will land in their downloads folder. |
| Modal width | The description paragraph wraps awkwardly at the current width. |

Deferred: a collapsible file-tree preview of the archive contents, and an "open destination
folder after download" option.

---

## 4. 3D view — the highest-value block

Mockup: [`openpcb_3d_view_redesign_v1.html`](mockups/openpcb_3d_view_redesign_v1.html) — it shows
the populated left panel of §4.1 and the enclosure card of §4.3 in place.

The 3D view is the weakest surface in the application and the largest untouched opportunity. It
renders a board and does nothing else. Roughly a fifth of the screen is an empty left panel.

The view has three jobs and currently serves none of them well:

1. **Verify mechanical fit** — heights, connector positions, enclosure clearance.
2. **Sanity-check placement** before export.
3. **Produce a shareable image** of the board.

Each is currently a job the user leaves the application to do.

### 4.1 Populate the left panel

An empty panel signals "unfinished" more loudly than a missing feature does. Even a minimal
version is a large improvement. Five sections:

| Section | Contents |
|---|---|
| Camera presets | Isometric, perspective, top, front, side, back — a six-button grid |
| Display toggles | Components, silkscreen, reference designators, height heatmap, floor grid |
| Board colour | Matte green, matte black, blue, red, white, yellow |
| Scene | Studio dark (default), studio light, outdoor, transparent |
| Transparency | Board transparency slider for an X-ray view of internal routing |

Recommended defaults: **isometric camera** on first open — it is faster to render and easier to
compare boards across sessions than a perspective view. Floor grid **off** by default,
remembered per design.

A transparent-background scene preset is worth calling out separately: it is what makes a render
usable as a hero image in a blog post or a forum thread, and it is nearly free once the other
presets exist.

### 4.2 STEP / STL export

Mechanical designers checking enclosure fit need the board as a solid. Both formats export in
millimetres; STL carries no unit metadata, so the export needs a tooltip explaining how the
receiving CAD tool should interpret it rather than a unit toggle.

### 4.3 Minimum-enclosure card

A single line in the right-hand inspector:

```
Min enclosure: 52 × 32 × 13 mm
Board + 1 mm margin + tallest part + 1 mm air gap
```

This answers the most-asked question of the hobbyist audience — how big does the 3D-printed
case need to be — and no comparable EDA tool surfaces it. The margins should become editable
defaults in settings, since a tight project and a thermally-constrained one want different
values.

Extension worth planning for but not scheduling: clicking the card exports a STEP solid of the
computed bounding box, ready to shell in a mechanical CAD tool. That depends on §4.2 landing
first.

### 4.4 Component model sourcing — the debate is half-settled

The review framed model sourcing as an open three-way choice between converting KiCad's public
3D model library, procedurally generating models from footprint geometry, and shipping models
inside community library packages.

**Two of the three inputs are already resolved in this repo, so the question is narrower than
the review assumed:**

- A **STEP-to-GLB conversion package already exists** in the workspace and is wired into the
  library module's 3D preview path. The conversion pipeline is not hypothetical work.
- The **core library already ships 139 GLB models**, so a baseline of real models is already
  present, and the "packages carry embedded models" path is already the shipping mechanism.

What remains genuinely open is coverage and licensing: whether to bulk-convert KiCad's model
library for parts the core library does not cover, and how to discharge the attribution
obligations of its share-alike licence. A procedural fallback for footprints with no model at
all remains sensible as a floor.

**Unverified:** the exact licence terms and the required attribution form were not checked
during this consolidation and must be confirmed before any bulk conversion.

### 4.5 Deferred 3D items

Height-heatmap shading on the actual component meshes, a functional transparency pass, a
point-to-point measure tool, and a turntable capture for sharing. All are real, none blocks the
items above.

---

## 5. BOM

Mockups: [`openpcb_bom_redesign_v1.html`](mockups/openpcb_bom_redesign_v1.html) for the table and
the cost preview;
[`openpcb_assistant_bom_placement_diagram_v1.html`](mockups/openpcb_assistant_bom_placement_diagram_v1.html)
for BOM and placement proposals rendered as diagram cards in chat.

### 5.1 Severity differentiation

Every unsourced line currently renders in the same warning colour. That is wrong on its face: a
missing manufacturer part number on a generic 0603 resistor is low risk and a missing part
number on the main IC is high risk, and treating them identically means the user reads past both.

Three tiers:

| Tier | Applies to | Meaning |
|---|---|---|
| Critical | ICs, regulators, microcontrollers, connectors | Missing part number blocks ordering |
| Suggested | Passives — resistors, capacitors, LEDs | Missing part number is normal; a generic substitute is fine |
| Sourced | Anything with a resolved part number | Done |

The classification rules belong in one place as a component-class map, not scattered across the
table renderer. Cheap to implement and a real usability gain.

### 5.2 Cost preview — blocked

The cost estimate is currently blank, which reads as a bug rather than as "not yet priced". At
minimum, replace the empty value with an explanatory state that tells the user what to do:
add part numbers to get an estimate.

The full breakdown — parts split by basic and extended, per-unique-extended-part setup cost,
assembly, stencil, per-board subtotal, and a savings tip naming a specific line to substitute —
turns the BOM into a cost coach. That is the valuable version.

**Blocked on manufacturer part-number data sources.** No decision exists on where part data
comes from: a bundled offline cache, a live supplier API, or an explicit-request-only external
lookup. Cache-first is faster and works offline; a live call is fresher but online-only. Nothing
downstream of this — auto-sourcing, cost estimation, lifecycle status, lead time — can be
scheduled until it is settled.

### 5.3 Smaller BOM items

- The right-hand detail rail is mostly empty for a generic part. It needs a condensed empty
  state rather than a full form with blank fields.
- The "unresolved" count badge is undefined — it is not clear whether it means the same thing as
  a missing part number.
- The export control has a dropdown affordance but no indication of the available formats.

---

## 6. Library

Mockup: [`openpcb_assistant_component_cards_v1.html`](mockups/openpcb_assistant_component_cards_v1.html)
— the compact component card the library grid's wasteful aspect ratio (§6.3) is measured against.

### 6.1 Search position consistency

The library grid puts its search field at the top right. The component picker modal puts it at
the top centre. These are the two component-finding surfaces in the application and they
disagree about where search lives.

Move the library grid's search to match the picker. **Consistency over novelty** — the picker is
the stronger of the two surfaces and is the one users hit more often.

### 6.2 Pin table on component detail

For any part with more than two pins, the detail page needs a pin table: number, name,
electrical type, description. This is the single most-consulted piece of information about an
integrated circuit and it is currently absent.

### 6.3 Other component-detail gaps

- **Datasheet link.** Requires a datasheet URL field on the component schema. Hobbyists need
  this constantly and there is nowhere to put it today.
- **Clickable warnings.** The detail page shows a warning count with no way to see what the
  warning is.
- Card aspect ratio in the grid is wasteful — the symbol occupies about half the card height.
  A compact-density toggle would fit substantially more parts per screen.
- Thumbnails are monochrome and near-identical at a glance for similar package families.

---

## 7. Settings

Mockup:
[`openpcb_settings_assistant_redesign_v2_stacked.html`](mockups/openpcb_settings_assistant_redesign_v2_stacked.html).
It predates §7.3: the review it came from proposed the `Saved · encrypted locally` badge, so if
the mockup shows that badge, that part of it is superseded and must not be built.

### 7.1 Test-connection inline feedback

Clicking the connection test gives no visible result. The outcome must render **inline next to
the button** — success with latency and, where the provider reports it, model count; failure
with the HTTP status translated into a human reason (invalid key, rate limited, service not
running).

The per-provider-type test requests are straightforward: a models-list call for
OpenAI-compatible endpoints and local servers, a minimal completion where no list endpoint
exists.

### 7.2 Masked key display

When a key is saved, the input is empty, which is indistinguishable from having no key at all.
Show a masked value with the last few characters visible, so the user can confirm *which* key is
stored, plus a reveal control and a replace action.

### 7.3 Do not ship: the "encrypted locally" badge

The review proposed a green `Saved · encrypted locally` badge above the key field.

**Do not ship this badge.** Keys are stored **in plaintext today**. The badge would be a false
security claim, and a false security claim about credential storage is materially worse than no
claim at all — it actively discourages the user from taking the precautions they would otherwise
take.

The badge becomes shippable only once keys move to OS-keychain-backed storage. That work is
tracked separately. Until it lands, the masked display in §7.2 is the correct amount of
reassurance: it confirms a key is present without asserting anything about how it is protected.

### 7.4 Provider status signal

The provider list uses a green check on multiple entries while also highlighting one as
selected, so it is unclear whether the check means configured, active, or available. Pick one
meaning and use one signal for it.

### 7.5 Library settings

The library source table shows a signature status with no explanation of why signature status
matters. Library signing is what prevents malicious symbol injection; that deserves a tooltip or
an inline explainer, not a bare yellow word.

---

## 8. Docked chat panel — header reduction

Mockups: [`openpcb_docked_chat_panel_v2.html`](mockups/openpcb_docked_chat_panel_v2.html) for the
two-row header target below, plus three mockups of what sits inside it —
[`openpcb_assistant_chat_interface_v2.html`](mockups/openpcb_assistant_chat_interface_v2.html),
[`openpcb_assistant_chat_shell_markdown_tools_v1.html`](mockups/openpcb_assistant_chat_shell_markdown_tools_v1.html)
and [`openpcb_assistant_mermaid_showcase_v1.html`](mockups/openpcb_assistant_mermaid_showcase_v1.html).

The docked assistant panel spends about four stacked rows — roughly **120 px** — on header
chrome before any message renders. On a panel around 700 px tall that is about 15% of the
height, and the rows are largely redundant: a generic "Chat" label above a subtitle naming the
design the panel is already docked inside, above a chat-name row, above a full-width row
containing a verbose model identifier.

Target: **two rows, about 58 px.**

| Row | Contents |
|---|---|
| 1 | Chat-switcher pill (chat name plus count of chats on this design) · pop-out · overflow menu · close |
| 2 | Model pill · tools indicator · last-activity metadata |

**Measurable gain: roughly 62 px of vertical space recovered — about two additional messages
visible, or about 9% of a 700 px panel returned to content.**

Supporting changes in the same pass: drop the generic panel label, drop the redundant design
subtitle, drop the literal "chat" suffix from displayed chat names, and give the pop-out control
an accessible label and tooltip.

The panel's resize geometry and narrow-width card reflow are a contract, not a backlog item —
they are specified in `docs/assistant/chat-ui-spec.md` §12.

---

## 9. Real bug — chat search input leaks browser history

**This is a defect, not a design opinion.**

The assistant sidebar's chat-search input is missing `autocomplete="off"`. The browser therefore
offers autofill suggestions drawn from **unrelated sites the user has visited**, and those
suggestions render inside the application's own UI.

It is a one-attribute fix. It is listed separately from the design items because it should not
wait for a design pass — it is a privacy leak into a surface that has nothing to do with the
data being leaked.

Audit any other free-text search or filter input in the application for the same omission while
fixing it.

---

## 10. Component to promote

Mockup:
[`openpcb_settings_assistant_redesign_v2_stacked.html`](mockups/openpcb_settings_assistant_redesign_v2_stacked.html)
— the stacked-card pattern applied to assistant providers, which is where it was adopted.

The stacked-card pattern — a compact summary header that expands in place into a full-width form
— should be promoted to a shared component.

It was adopted after the master-detail layout for assistant providers was explicitly rejected as
too dense: a sidebar list plus a detail pane cramps both halves. The stacked accordion gives an
expanded card the full content width, keeps the collapsed cards scannable, and scales to any
number of entries without a redesign.

It applies to at least three surfaces: assistant providers, installed libraries in settings, and
footprint variants on the library detail page. Interaction rules that came with it: one card
expanded at a time, the whole collapsed header is the expand target, and row-level action
controls do not collapse the card.

---

## 11. Open workflow question — where does "update from schematic" live?

**This is the one genuinely unanswered product question in the review, and it is not a UI
question.** The PCB editor mockup
([`openpcb_pcb_editor_redesign_v1.html`](mockups/openpcb_pcb_editor_redesign_v1.html)) is the
surface the answer has to land in, and it does not answer it.

When a user edits the schematic — adds a part, changes a connection — the PCB needs to take
those changes. That propagation step is conventionally called an engineering change order, and
it has **no surfaced UI anywhere in the application**.

The question is sharpened, not softened, by an existing locked decision: automatic
synchronisation of schematic wires into PCB traces is **wontfix**, on the grounds that the
bridge between schematic and PCB is the netlist, not the geometry. That decision is correct, and
it is exactly what makes an explicit, user-triggered propagation step necessary — if the sync is
not automatic, something must let the user ask for it.

Unresolved: whether it is a toolbar action in the PCB editor, a notification banner that appears
when the PCB is behind the schematic, a modal showing the pending change set, or some
combination. It also needs a definition of what the user sees and approves: a diff of added,
removed and changed parts and nets, or a silent reconciliation.

This should be answered before the PCB editor gets another significant UI pass, because the
answer changes where things go.
