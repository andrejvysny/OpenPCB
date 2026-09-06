import { FileUp, Plus } from "lucide-react";
import { type ReactElement } from "react";
import { Button } from "@shared/frontend/ui/button";
import type { DesignerDesignSummary } from "../../../../sdks/designer";

interface DesignerEmptyStateProps {
  designs: DesignerDesignSummary[];
  creatingDesign: boolean;
  onCreate(): void;
  onOpen(designId: string): void;
  onImportKicad?(): void;
}

export function DesignerEmptyState({
  designs,
  creatingDesign,
  onCreate,
  onOpen,
  onImportKicad,
}: DesignerEmptyStateProps): ReactElement {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-app p-6">
      <div className="flex w-full max-w-md flex-col items-stretch gap-4 rounded-control border border-border bg-surface-panel p-6">
        <div className="text-center">
          <h2 className="text-base font-medium text-text-strong">
            No design open
          </h2>
          <p className="mt-1 text-xs text-text-tertiary">
            Create a new design or open an existing one to get started.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={onCreate}
          disabled={creatingDesign}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          {creatingDesign ? "Creating…" : "New design"}
        </Button>
        {onImportKicad && (
          <Button
            variant="secondary"
            size="lg"
            onClick={onImportKicad}
            disabled={creatingDesign}
            icon={<FileUp className="h-3.5 w-3.5" />}
          >
            Import KiCad project…
          </Button>
        )}
        {designs.length > 0 && (
          <div className="flex flex-col">
            <div className="px-2 py-1 text-2xs uppercase tracking-[.04em] text-text-caps">
              Open existing
            </div>
            <div className="flex max-h-64 flex-col overflow-y-auto">
              {designs.map((design) => (
                <button
                  key={design.id}
                  type="button"
                  onClick={() => onOpen(design.id)}
                  className="flex h-[22px] items-center justify-between gap-2 px-2 text-left text-xs text-text transition-colors hover:bg-surface-hover hover:text-text-strong"
                >
                  <span className="truncate">
                    {design.name || "Untitled Design"}
                  </span>
                  <span className="shrink-0 font-mono text-2xs text-text-disabled">
                    r{design.revision}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
