import { Button } from "@shared/frontend/ui/button";
import { PanelSectionHeader } from "@shared/frontend/ui/panel-section-header";
import { PropertyGrid, PropertyRow } from "@shared/frontend/ui/property-grid";
import { SchematicThumbnail } from "./SchematicThumbnail";
import { ActionsMenu, DrcPill, type DesignSummary } from "./DesignCard";
import { formatDate, formatTimestamp } from "./format";

export interface DesignDetailPanelProps {
  design: DesignSummary | null;
  starred: boolean;
  archived: boolean;
  onOpen: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

/**
 * 300px right panel (design D3 §4). Board size, layers, nets, location and the
 * activity feed the design sketches are omitted — `DesignerDesignSummary`
 * carries none of that data (PLAN §2 D6).
 */
export function DesignDetailPanel({
  design,
  starred,
  archived,
  onOpen,
  onToggleArchive,
  onDelete,
}: DesignDetailPanelProps) {
  if (!design) {
    return (
      <aside className="flex w-[300px] shrink-0 flex-col items-center justify-center border-l border-border bg-surface-panel text-xs text-text-tertiary">
        Select a design
      </aside>
    );
  }

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface-panel">
      <div className="flex h-[34px] shrink-0 items-center gap-2 border-b border-border px-2">
        <span
          className="min-w-0 flex-1 truncate text-base font-medium text-text-strong"
          title={design.name}
        >
          {design.name}
        </span>
        <Button variant="primary" onClick={onOpen}>
          Open
        </Button>
        <ActionsMenu
          archived={archived}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
          className="border border-border-control"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="h-[170px] shrink-0 overflow-hidden border-b border-border bg-surface-canvas-well">
          <SchematicThumbnail preview={design.schematicPreview} />
        </div>

        <PanelSectionHeader variant="uppercase" title="Design" />
        <PropertyGrid>
          <PropertyRow label="Revision" mono>
            r{design.revision}
          </PropertyRow>
          <PropertyRow label="Created">
            {formatDate(design.createdAt)}
          </PropertyRow>
          <PropertyRow label="Modified">
            {formatTimestamp(design.updatedAt)}
          </PropertyRow>
        </PropertyGrid>

        <PanelSectionHeader variant="uppercase" title="Status" />
        <PropertyGrid>
          <PropertyRow label="DRC">
            <DrcPill status={design.drcStatus} />
          </PropertyRow>
          <PropertyRow label="Starred">{starred ? "Yes" : "No"}</PropertyRow>
          <PropertyRow label="Archived">{archived ? "Yes" : "No"}</PropertyRow>
        </PropertyGrid>
      </div>
    </aside>
  );
}
