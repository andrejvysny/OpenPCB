import {
  AlertOctagon,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Check,
  CircleDashed,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "@shared/frontend/ui/pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/frontend/ui/dropdown-menu";
import type {
  DesignerDrcStatus,
  DesignerSchematicPreview,
} from "@sdks/designer";
import { SchematicThumbnail } from "./SchematicThumbnail";
import { formatRelativeTime } from "./format";

export interface DesignSummary {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  schematicPreview?: DesignerSchematicPreview | null;
  drcStatus?: DesignerDrcStatus | null;
}

interface DesignCardProps {
  design: DesignSummary;
  view: "grid" | "list";
  starred: boolean;
  archived: boolean;
  onOpen: () => void;
  onToggleStar: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

/** DRC status badge sourced from the latest persisted run on the summary. */
export function DrcPill({ status }: { status?: DesignerDrcStatus | null }) {
  if (!status) {
    return (
      <Pill tone="neutral" icon={<CircleDashed className="h-3 w-3" />}>
        DRC not run
      </Pill>
    );
  }
  if (status.stale) {
    return (
      <Pill
        tone="neutral"
        icon={<CircleDashed className="h-3 w-3" />}
        title={`DRC last ran at r${status.ranAtRevision}; board has changed`}
      >
        DRC stale
      </Pill>
    );
  }
  if (status.errors > 0) {
    return (
      <Pill tone="danger" icon={<AlertOctagon className="h-3 w-3" />}>
        {status.errors} {status.errors === 1 ? "error" : "errors"}
      </Pill>
    );
  }
  if (status.warnings > 0) {
    return (
      <Pill tone="warning" icon={<AlertTriangle className="h-3 w-3" />}>
        {status.warnings} {status.warnings === 1 ? "warning" : "warnings"}
      </Pill>
    );
  }
  return (
    <Pill tone="success" icon={<Check className="h-3 w-3" />}>
      DRC clean
    </Pill>
  );
}

export function ActionsMenu({
  archived,
  onToggleArchive,
  onDelete,
  className,
}: Pick<DesignCardProps, "archived" | "onToggleArchive" | "onDelete"> & {
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More actions"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-control",
            "text-text-tertiary outline-none hover:bg-surface-hover hover:text-text-strong",
            className,
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        {/* No backend endpoint yet — disabled with tooltip (Coming soon). */}
        <DropdownMenuItem disabled title="Coming soon">
          <Pencil className="h-3.5 w-3.5" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Coming soon">
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Coming soon">
          <Download className="h-3.5 w-3.5" /> Export…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onToggleArchive();
          }}
        >
          {archived ? (
            <>
              <ArchiveRestore className="h-3.5 w-3.5" /> Unarchive
            </>
          ) : (
            <>
              <Archive className="h-3.5 w-3.5" /> Archive
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          destructive
          onSelect={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StarButton({
  starred,
  onToggle,
}: {
  starred: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={starred ? "Unstar" : "Star"}
      aria-pressed={starred}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex p-0.5 outline-none",
        starred
          ? "text-status-warning"
          : "text-text-disabled hover:text-text-secondary",
      )}
    >
      <Star className="h-3 w-3" fill={starred ? "currentColor" : "none"} />
    </button>
  );
}

export function DesignCard(props: DesignCardProps) {
  const { design, view, starred, onOpen, onToggleStar } = props;

  if (view === "list") {
    return (
      <div
        onClick={onOpen}
        className="flex cursor-pointer items-center gap-3 border-b border-border-subtle px-[10px] py-2 hover:bg-surface-hover"
      >
        <div className="h-9 w-16 shrink-0 overflow-hidden border border-border bg-surface-canvas-well">
          <SchematicThumbnail preview={design.schematicPreview} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-text-strong">
            {design.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-2xs text-text-tertiary">
            <span className="font-mono">r{design.revision}</span>
            <span>{formatRelativeTime(design.updatedAt)}</span>
          </div>
        </div>
        <DrcPill status={design.drcStatus} />
        <StarButton starred={starred} onToggle={onToggleStar} />
        <ActionsMenu {...props} />
      </div>
    );
  }

  return (
    <div
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-control border border-border bg-surface-panel transition-colors hover:border-border-control hover:bg-surface-hover"
    >
      <div className="aspect-[2/1] overflow-hidden border-b border-border bg-surface-canvas-well">
        <SchematicThumbnail preview={design.schematicPreview} />
      </div>
      <div className="p-2">
        <div className="mb-1 flex items-center justify-between gap-1.5">
          <h3 className="truncate text-sm font-medium text-text-strong">
            {design.name}
          </h3>
          <StarButton starred={starred} onToggle={onToggleStar} />
        </div>
        <div className="mb-1.5 flex items-center gap-1.5 text-2xs text-text-tertiary">
          <span className="font-mono">r{design.revision}</span>
          <span className="text-text-disabled">·</span>
          <span>{formatRelativeTime(design.updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border-subtle pt-1.5">
          <DrcPill status={design.drcStatus} />
          <ActionsMenu {...props} />
        </div>
      </div>
    </div>
  );
}
