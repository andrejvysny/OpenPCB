import { Filter, X } from "lucide-react";
import type { ReactElement } from "react";

/**
 * Floating selection-filter panel — per primitive-kind opt-out for both
 * single-click and marquee selection. Mirrors KiCad's Selection Filter:
 * disabling "Vias" makes via primitives unselectable without hiding them
 * visually, so the user can drag-select a region without grabbing the via
 * underneath. Toggle visibility with the `F` hotkey.
 *
 * Filters are session-scoped (not persisted to board_settings) — they're
 * an interaction preference, not a property of the design.
 */
export type SelectionFilterKind = "traces" | "vias" | "pads" | "placements";

interface FilterState {
  traces: boolean;
  vias: boolean;
  pads: boolean;
  placements: boolean;
}

const KINDS: ReadonlyArray<{
  id: SelectionFilterKind;
  label: string;
  hint: string;
}> = [
  { id: "traces", label: "Traces", hint: "Routed copper segments" },
  { id: "vias", label: "Vias", hint: "Through-hole vias" },
  { id: "pads", label: "Pads", hint: "Component pads" },
  { id: "placements", label: "Components", hint: "Placed footprints" },
];

export function PcbSelectionFilter({
  filter,
  onChange,
  onClose,
}: {
  filter: FilterState;
  onChange: (kind: SelectionFilterKind, enabled: boolean) => void;
  onClose: () => void;
}): ReactElement {
  return (
    <div
      role="dialog"
      aria-label="Selection filter"
      className="pointer-events-auto absolute right-3 top-[92px] z-30 w-56 rounded-float border border-border bg-surface-panel shadow-lg"
    >
      <div className="flex h-[24px] items-center justify-between border-b border-border bg-surface-section px-2">
        <div className="flex items-center gap-1.5 text-2xs uppercase tracking-[.04em] text-text-tertiary">
          <Filter className="size-3" />
          Selection filter
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filter panel"
          className="rounded-control p-0.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-strong"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="py-1">
        {KINDS.map((k) => {
          const enabled = filter[k.id];
          return (
            <label
              key={k.id}
              className="flex h-[22px] cursor-pointer items-center gap-2 px-2 hover:bg-surface-hover"
              title={k.hint}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onChange(k.id, e.target.checked)}
                className="size-3 accent-[var(--selection)]"
              />
              <span
                className={`flex-1 text-xs ${
                  enabled ? "text-text-strong" : "text-text-disabled line-through"
                }`}
              >
                {k.label}
              </span>
              <span className="text-2xs text-text-disabled">{k.hint}</span>
            </label>
          );
        })}
      </div>
      <div className="border-t border-border px-2 py-1 text-2xs text-text-disabled">
        Press <kbd className="rounded-control border border-border-control px-1 font-mono">F</kbd> to
        toggle.
      </div>
    </div>
  );
}
