# Scope table and quoted invariants

Read this before building any packet. Everything below is quoted or closely paraphrased from
source — verify against the live file if it looks stale; this reference is a packet-assembly aid,
not the source of truth.

## Scope table

| Area | Path | Astra routing |
|---|---|---|
| DRC engine + checks | `src/modules/designer/backend/drc/` (`checks/*.ts`, `drc-context.ts`, `severity.ts`, `violation-id.ts`, `ipc2221-spacing.ts`), `src/shared/drc/rule-resolver.ts` | ✅✅ always eligible |
| PCB geometry | `src/shared/pcb-geometry/` (`pcb-trace-geometry.ts`, `pcb-clearance-geometry.ts`, `pad-geometry.ts`, `pad-outline.ts`, `rotation.ts`) | ✅✅ |
| Manual routing (route/walkaround/tune/bundle/diff-pair tools) — **not** the cloud auto-layout service | `src/shared/pcb-routing/` (`route-obstacles.ts`, `collision.ts`, `corner-fixup.ts`, `pull-tight.ts`, `walkaround.ts`, `auto-finish.ts`, `meander.ts`, `bundle-geometry.ts`), `src/modules/designer/frontend/pcb/tools/` | ✅✅ |
| Ratsnest / connectivity | `src/modules/designer/backend/pcb/ratsnest.ts` (union-find MST builder), `pcb-pad-nets.ts` | ✅ |
| Copper pours / polygon booleans | `src/shared/rendering/copper-fill/` (`copper-geometry-kernel.ts` — the Clipper2 kernel; real in-tree code, **not** a package shim, unlike most of `src/shared/rendering/`), `src/shared/rendering/pcb/` (`outline-geometry.ts`, `chain-edges.ts`, `contour-validation.ts`, `outline-manufacturability.ts`, `pcb-drills.ts`) | ✅✅ |
| ERC / electrical rules | `src/modules/designer/backend/erc/erc-engine.ts`, `src/shared/schematic-routing/` (`manhattan.ts`, `schematic-autoroute.ts`, `wire-obstacles.ts`, `crossing-gaps.ts`) | ✅✅ |
| Signal integrity / length matching | `checks/signal-integrity.ts` (diff-pair skew/gap), `checks/length.ts`, `backend/pcb/diff-pair-resolver.ts` | ✅✅ |
| Stackup / manufacturability / DFM | `checks/manufacturability.ts` (via/drill/annular/aspect-ratio, FAB tier), `checks/constraints.ts` (stackup) | ✅ |

**Explicitly out of scope** — refuse and redirect to `/codex-implementation-review` or plain
Claude review:
- `cloud-workspace/cloud-auto-layout/` — a separate repo/service with its own legality oracle; not
  manual routing, out of this skill's blast radius entirely.
- UI, forms, CRUD, Electron plumbing, KiCad import UI, library editors — no correctness invariant
  at stake that justifies Astra's cost.

## Coordinate contract (from `OpenPCB/CLAUDE.md`)

> **world = nanometres · scene = millimetres · screen = pixels**, with `NM_TO_SCENE = 1_000_000`.
> Integer nanometres are the persisted unit everywhere.

`src/shared/pcb-routing/` and `src/shared/schematic-routing/` operate in integer nanometres and
are explicitly deterministic (no `Math.random`/`Date.now`). DRC (`backend/drc/`) converts to an
mm-domain view for its checks (`drc-context.ts`). Always state which domain a packet's numbers are
in — a bug can be a units mismatch at this exact boundary.

## DRC invariants — verbatim from `src/modules/designer/AGENTS.md`, "## DRC"

> - **Only `clearanceMm` from `PcbNetClass` is enforced.** `traceWidthMm`, `viaDiameterMm`,
>   `viaDrillMm`, `defaultViaProtection` and `color` are **stored but unused by DRC** — they feed
>   route-tool defaults. A net class with a wider `traceWidthMm` produces **no** per-net min-width
>   violation. Do not assume per-net width or via geometry is validated anywhere.
> - **Net class can only tighten.** Clearance resolves as `max(designRule, netA, netB)`. There is
>   no mechanism for a net class to relax a board rule.
> - **Dispatch is a hardcoded array, not a registry.** The engine builds one `DrcContext` and
>   spreads seven pure `(ctx: DrcContext) => DrcViolationDraft[]` checks into a flat list. Adding a
>   check is trivial — a new file under `drc/checks/` plus one array entry. The real cost is always
>   the **rules-input schema**.
> - **`DrcRuleClass` has exactly five values:** `clearance | constraint | connectivity |
>   manufacturability | structural`. There is **no `copper-pour` class** — pour islands report
>   under `structural`. Do not add a sixth without checking every consumer that switches on the
>   union.
> - Violation ids are order-independent by construction (a hash over code plus **sorted** anchor
>   keys), which is what makes waivers survive re-runs.
> - **Apply-time re-validation is a non-blocking backstop, not a gate.** Both cloud apply handlers
>   run `runDrc` and report the result but do **not** reject a bad envelope and do **not** persist
>   the report.

## Determinism contract — from `OpenPCB/docs/drc/OPEN_FINDINGS.md` §5.2

> The engine is a pure function. Grep-verified: no `Date`, no `Math.random`, no I/O anywhere under
> `drc/`. ... Violation ids are FNV-1a-64 over the rule code plus the **sorted** anchor keys, which
> makes them order-independent by construction rather than by convention.
>
> **The caveat that must survive:** reordering the *input* arrays changes presentation order — the
> order of `violations[]`, the key order of `countsByCode`, and anchor order within pairwise
> violations. Consumers that need canonical bytes across input reorderings must **sort by
> violation id** first.

## Epsilon policy — from `OpenPCB/docs/drc/OPEN_FINDINGS.md` §5.1

Four comparison regimes, unified in `src/modules/designer/backend/pcb/tolerance.ts`
(`below`/`exceeds`, `DRC_EPS_MM = 1e-6`, `SHORT_EPS_MM = 1e-4`):

| Regime | Form | Applies to | Boundary behaviour |
|---|---|---|---|
| Minimums | `below(v, limit)` = `v < limit − 1e-6` | Manufacturability minimums, board checks | Exact-spec geometry passes; sub-nm float noise forgiven |
| Clearance | bare `gap < required` | All clearance pairs, FAB tier | Exact equality passes; a 1 nm deficit errors — zero grace |
| Short | `gap <= SHORT_EPS_MM` (1e-4), **inclusive** | Short tier | A gap of exactly 1e-4 mm is a short |
| Fab validators | bare `<`/`>`, no epsilon | Fab preset comparisons | Has produced a real false positive on a derived float |

If a packet touches any comparison logic, quote the relevant regime — do not let Astra assume a
uniform epsilon.

## Net-class resolution chain — from `OpenPCB/docs/drc/OPEN_FINDINGS.md` §5.3

`resolveNetClassId` resolves in order: (1) explicit `perNetClassAssignments[netId]` if still
valid, (2) anchored name regexes tried `GND_NAMES` → `POWER_NAMES` → `POWER_VOLTAGE` (fully
anchored — `GND_SENSE` does not match `GND`), (3) `board.netClasses[0]` as a silent, array-order-
dependent fallback for everything else. Step 3 is untested and fragile — flag it explicitly if a
packet touches net-class resolution.

## Known open defect register

`OpenPCB/docs/drc/OPEN_FINDINGS.md` is the live defect register — 19 confirmed open DRC bugs, each
with a `test.todo` regression test (`rg -n "test\.todo" src/core/backend/tests/drc-audit-b*.test.ts`
should show 20 lines / 19 unique ids; if the count drops without a finding being removed from the
doc, the register is stale). **Always check this file for an overlapping finding before treating
something as a new bug.**

The highest-severity, currently-unowned finding, quoted in full since it is the best worked
example of the bug class this skill exists to catch — a check that looks correct in isolation but
is unsound across a boundary:

> ## B3-1 — an unrouted `GND` net reports DRC-clean on a default board
>
> **Severity: HIGH.** This is the finding to escalate. A completely unrouted ground net on a
> default board produces no violation of any kind.
>
> **Mechanism.** The ratsnest builder drops GND-named nets *by name*, and it does so **before**
> any check for whether a copper pour actually exists. On a default board `copperFillLayers` is
> empty. So the two checks that should catch an unrouted ground both miss:
>
> - `UNCONNECTED_NET` (connectivity check) trusts `projection.ratsnest`. GND was suppressed from
>   the ratsnest, so there are no airwires, so there is nothing to report.
> - `ISOLATED_COPPER_ISLAND` (copper-pour check) only iterates board-wide fill layers. There are
>   none, so it never runs.
>
> The name-based suppression is only defensible if a same-net pour is guaranteed to satisfy the
> net. The doc comment in the copper-pour check asserts exactly that — **and it is false for this
> path**, because nothing verifies that a pour exists.
>
> **The test codifies the wrong behaviour.** The ratsnest test suite contains an assertion that a
> GND net with no routing produces no airwires. It passes. Fixing B3-1 means changing that test,
> not just the engine.
>
> **Anchors.** Ratsnest builder (`pcb/ratsnest.ts`), GND name-suppression branch · default
> `copperFillLayers` in `pcb-defaults.ts` · `checks/connectivity.ts` · `checks/copper-pour.ts`

Other open milestones with owned findings, worth checking before a packet on the same area:
**P4** (backend spatial index / rbush, byte-identity gate), **P7** (async DRC + live/batch
parity), **P9** (DFM overlay: courtyard/silk/mask/sliver), **P12** (rules & severity UI, not
started).

## Manufacturing/electrical constants

Never invent a clearance, trace-width, via, or IPC-2221 value in a packet. Pull it from
`/eda-standards` (`.claude/skills/eda-standards/`) or quote it verbatim from source
(`ipc2221-spacing.ts`, `fab-presets.ts`). If Astra cites a different numeric value, flag it as
needing verification against `/eda-standards` rather than trusting it — `OPEN_FINDINGS.md` §5.7
notes the live JLCPCB capabilities page is the resolution rule of last resort for threshold
conflicts, not a cached table.
