import { useMemo, type ReactElement } from "react";
import type { PcbPlacedPart } from "../../../../sdks";
import { TableHeaderRow, TableRow } from "@shared/frontend/ui/data-table";

const COLS = "40px 1fr 80px";

/**
 * Natural refdes order: alphabetic prefix first, then the numeric suffix as a
 * number (so R2 sorts before R10). Refs without a numeric tail fall back to a
 * plain locale compare.
 */
function compareReference(a: string, b: string): number {
  const ma = /^([^\d]*)(\d*)/.exec(a);
  const mb = /^([^\d]*)(\d*)/.exec(b);
  const prefix = (ma?.[1] ?? "").localeCompare(mb?.[1] ?? "");
  if (prefix !== 0) return prefix;
  const na = ma?.[2] ? Number.parseInt(ma[2], 10) : Number.NaN;
  const nb = mb?.[2] ? Number.parseInt(mb[2], 10) : Number.NaN;
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b);
  if (na !== nb) return na - nb;
  return a.localeCompare(b);
}

export interface PcbComponentsPanelProps {
  placements: ReadonlyArray<PcbPlacedPart>;
  /** Schematic part id → value (the PCB projection carries no value field). */
  partValues: ReadonlyMap<string, string>;
  selectedIds: ReadonlySet<string>;
  onSelect: (placementId: string) => void;
}

/**
 * Sidebar list of every footprint placed on the board (design D2 §6). Clicking
 * a row selects that placement on the canvas — the same single-select the
 * canvas click path produces.
 */
export function PcbComponentsPanel({
  placements,
  partValues,
  selectedIds,
  onSelect,
}: PcbComponentsPanelProps): ReactElement {
  const rows = useMemo(
    () =>
      [...placements].sort((a, b) => compareReference(a.reference, b.reference)),
    [placements],
  );

  if (rows.length === 0) {
    return (
      <div className="px-[10px] py-1.5 text-2xs text-text-tertiary">
        No components placed on the board.
      </div>
    );
  }

  return (
    <div>
      <TableHeaderRow cols={COLS}>
        <span>Ref</span>
        <span>Footprint</span>
        <span className="text-right">Value</span>
      </TableHeaderRow>
      {rows.map((placement) => (
        <TableRow
          key={placement.id}
          cols={COLS}
          selected={selectedIds.has(placement.id)}
          onClick={() => onSelect(placement.id)}
          className="cursor-pointer"
          data-testid={`pcb-component-row-${placement.id}`}
        >
          <span className="truncate font-mono text-text-strong">
            {placement.reference}
          </span>
          <span
            className="truncate font-mono text-2xs text-text-tertiary"
            title={placement.footprint.name}
          >
            {placement.footprint.name}
          </span>
          <span className="truncate text-right">
            {partValues.get(placement.partId) ?? ""}
          </span>
        </TableRow>
      ))}
    </div>
  );
}
