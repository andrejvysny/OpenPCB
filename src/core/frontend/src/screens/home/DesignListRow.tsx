import { TableRow } from "@shared/frontend/ui/data-table";
import { SchematicThumbnail } from "./SchematicThumbnail";
import { DrcPill, StarButton, type DesignSummary } from "./DesignCard";
import { formatDate, formatRelativeTime } from "./format";

/** Preview · Name · Rev · DRC · Modified · star (design D3 §4). */
export const DESIGN_LIST_COLS = "220px 1fr 70px 90px 110px 24px";

export interface DesignListRowProps {
  design: DesignSummary;
  starred: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onToggleStar: () => void;
}

/** One 64px design row. */
export function DesignListRow({
  design,
  starred,
  selected,
  onSelect,
  onOpen,
  onToggleStar,
}: DesignListRowProps) {
  return (
    <TableRow
      cols={DESIGN_LIST_COLS}
      height={64}
      selected={selected}
      onClick={onSelect}
      onDoubleClick={onOpen}
      className="cursor-pointer"
    >
      <div className="h-[52px] w-[220px] overflow-hidden border border-border bg-surface-canvas-well">
        <SchematicThumbnail preview={design.schematicPreview} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-text-strong">
          {design.name}
        </div>
        <div className="mt-0.5 truncate text-2xs text-text-tertiary">
          Created {formatDate(design.createdAt)}
        </div>
      </div>
      <span className="font-mono text-2xs text-text-secondary">
        r{design.revision}
      </span>
      <span className="min-w-0">
        <DrcPill status={design.drcStatus} />
      </span>
      <span className="text-2xs text-text-secondary">
        {formatRelativeTime(design.updatedAt)}
      </span>
      <StarButton starred={starred} onToggle={onToggleStar} />
    </TableRow>
  );
}
