import type { ReactElement } from "react";
import { PanelSectionHeader } from "@shared/frontend/ui";
import type { LibraryPinMapEntry } from "../../../../sdks/library";

interface PinsTableProps {
  pinMap: LibraryPinMapEntry[] | null;
  /** symbol-pin number → electrical type, sourced from the shared symbol preview. */
  electricalTypeByPin: Map<string, string>;
  /** Chip label, e.g. "0603 pin map". */
  packageLabel: string;
}

const COLS = "grid grid-cols-[80px_1fr_1fr_120px] items-center gap-2 px-3";

/** Full-width pin map for the selected footprint option. */
export function PinsTable({
  pinMap,
  electricalTypeByPin,
  packageLabel,
}: PinsTableProps): ReactElement {
  const hasPins = pinMap !== null && pinMap.length > 0;

  return (
    <section className="flex flex-col overflow-hidden rounded-control border border-border bg-surface-panel">
      <PanelSectionHeader
        variant="uppercase"
        title="Pins"
        count={`${packageLabel} pin map`}
      />

      {hasPins ? (
        <div>
          <div
            className={`${COLS} h-[22px] border-b border-border text-2xs uppercase tracking-[.04em] text-text-caps`}
          >
            <span>#</span>
            <span>Name</span>
            <span>Pin</span>
            <span className="text-right">Type</span>
          </div>
          {pinMap!.map((entry) => (
            <div
              key={`${entry.padNumber}:${entry.pinNumber}`}
              className={`${COLS} h-[22px] border-b border-border-subtle text-xs`}
            >
              <span className="truncate font-mono text-text-strong">
                {entry.padNumber}
              </span>
              <span className="truncate text-text-strong">
                {entry.pinName ?? "—"}
              </span>
              <span className="truncate font-mono text-text-secondary">
                {entry.pinNumber}
              </span>
              <span className="truncate text-right text-text-tertiary">
                {electricalTypeByPin.get(entry.pinNumber) ?? "—"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-8 text-center text-xs text-text-tertiary">
          No pin map for this footprint.
        </div>
      )}
    </section>
  );
}
