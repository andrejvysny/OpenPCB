import { useState, type DragEvent, type ReactElement } from "react";
import { Checkbox } from "@shared/frontend/ui";
import type { LibraryComponent } from "../../../sdks/library";
import { setComponentDragData } from "./lib/component-drag";

export { DRAG_MIME_TYPE } from "./lib/component-drag";

interface LibraryCardProps {
  component: LibraryComponent;
  moduleId: string;
  backendURL?: string | null;
  selected?: boolean;
  onOpen: (componentId: string) => void;
  onToggleSelect?: (componentId: string) => void;
}

export function LibraryCard({
  component,
  moduleId,
  backendURL,
  selected,
  onOpen,
  onToggleSelect,
}: LibraryCardProps): ReactElement {
  const [previewFailed, setPreviewFailed] = useState(false);
  const hasPlaceholderFootprint = component.tags.some(
    (t) => t.trim().toLowerCase() === "placeholder-footprint",
  );
  const isBuiltin = component.isBuiltin;
  const previewUrl = backendURL
    ? `${backendURL}/api/modules/${moduleId}/symbols/${encodeURIComponent(component.symbolId)}/preview.svg?theme=dark`
    : null;

  const borderClass = selected
    ? "border-selection"
    : "border-border hover:border-border-control";

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    setComponentDragData(event, component);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative flex h-56 w-full flex-col overflow-hidden rounded-control border bg-surface-panel text-left transition-colors ${borderClass}`}
      data-testid={`library-component-card-${component.id}`}
    >
      {!isBuiltin && (
        <span
          className="absolute left-2 top-2 z-10 inline-flex items-center bg-surface-panel p-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect?.(component.id)}
            aria-label={`Select ${component.name}`}
          />
        </span>
      )}
      {isBuiltin && (
        <span
          className="absolute right-2 top-2 z-10 inline-flex items-center bg-surface-control px-1.5 text-2xs uppercase tracking-[.06em] text-text-strong"
          title="Built-in component — read-only. Use Duplicate to edit."
        >
          Core
        </span>
      )}
      <button
        type="button"
        onClick={() => onOpen(component.id)}
        className="flex h-full w-full flex-col text-left outline-none focus-visible:border-selection"
      >
        <div className="relative flex h-28 items-center justify-center border-b border-border bg-surface-canvas-well px-4">
          {previewUrl && !previewFailed ? (
            <img
              src={previewUrl}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              onError={() => setPreviewFailed(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            <PreviewFallback name={component.name} />
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3">
          <h3 className="truncate text-sm font-medium leading-tight text-text-strong">
            {component.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-tertiary">
            {component.description || "No description"}
          </p>
          {hasPlaceholderFootprint && (
            <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
              <span
                className="inline-flex h-[18px] items-center rounded-control border border-border-control px-1.5 text-2xs text-text-secondary"
                title="Component imported without a footprint"
              >
                No footprint
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function PreviewFallback({ name }: { name: string }): ReactElement {
  const glyph = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span aria-hidden className="text-xl font-medium text-text-disabled">
      {glyph}
    </span>
  );
}
