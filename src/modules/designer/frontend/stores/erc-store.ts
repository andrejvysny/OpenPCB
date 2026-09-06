import { create } from "zustand";
import type { ErcReport } from "../../../../sdks";

/**
 * Transient ERC report store, modelled on `pcb/drc/drc-store` minus the
 * canvas-marker bookkeeping (centre requests, hover, waivers) — the schematic
 * has no ERC markers, only a dock list.
 *
 * The backend computes ERC on demand from the schematic projection and
 * persists nothing, so there is no hydrate-on-open path: the view runs it when
 * the tab first opens for a design, and `clear()` runs on design change.
 *
 * Violations carry no id, so the focused row is addressed by index into
 * `report.violations`.
 */
interface ErcStoreState {
  report: ErcReport | null;
  running: boolean;
  error: string | null;
  /** Index into `report.violations`, or null when nothing is focused. */
  selectedIndex: number | null;
}

interface ErcStoreActions {
  /** Run ERC via the supplied runner (wired to `api.runErc`). */
  run(runner: () => Promise<ErcReport | null>): Promise<void>;
  setReport(report: ErcReport | null): void;
  select(index: number | null): void;
  clear(): void;
}

/** Errors + warnings — the number the dock badge and status bar show. */
export function ercIssueCount(report: ErcReport | null): number {
  if (!report) return 0;
  return report.summary.errors + report.summary.warnings;
}

export const useErcStore = create<ErcStoreState & ErcStoreActions>(
  (set, get) => ({
    report: null,
    running: false,
    error: null,
    selectedIndex: null,

    async run(runner) {
      if (get().running) return;
      set({ running: true, error: null });
      try {
        const report = await runner();
        set({ report, running: false });
      } catch (err) {
        set({
          running: false,
          error: err instanceof Error ? err.message : "ERC failed",
        });
      }
    },

    setReport(report) {
      set({ report, selectedIndex: null });
    },

    select(index) {
      set({ selectedIndex: index });
    },

    clear() {
      set({ report: null, running: false, error: null, selectedIndex: null });
    },
  }),
);
