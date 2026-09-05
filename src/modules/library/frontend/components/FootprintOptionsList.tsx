import { useRef, type KeyboardEvent, type ReactElement } from "react";
import { PanelSectionHeader } from "@shared/frontend/ui";
import type { ComponentFootprintVariant } from "../types";

interface FootprintOptionsListProps {
  variants: ComponentFootprintVariant[];
  selectedFootprintId: string;
  onSelect: (footprintId: string) => void;
  backendURL: string | null | undefined;
  moduleId: string;
  themeMode: string;
}

/**
 * Selectable footprint-option spine. Pure local selection (no command/persist).
 * Implemented as a keyboard-operable radiogroup.
 */
export function FootprintOptionsList({
  variants,
  selectedFootprintId,
  onSelect,
  backendURL,
  moduleId,
  themeMode,
}: FootprintOptionsListProps): ReactElement {
  const sorted = variants.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const moveSelection = (currentIndex: number, delta: number) => {
    const nextIndex = (currentIndex + delta + sorted.length) % sorted.length;
    const next = sorted[nextIndex];
    if (next) {
      onSelect(next.footprintId);
      rowRefs.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    index: number,
    footprintId: string,
  ) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        moveSelection(index, 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        moveSelection(index, -1);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        onSelect(footprintId);
        break;
      default:
        break;
    }
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-control border border-border bg-surface-panel">
      <PanelSectionHeader
        variant="uppercase"
        title="Footprint options"
        count={sorted.length}
      />

      {/* `relative flex-1` collapses to zero intrinsic height (the absolute
          child doesn't count), so the options count never dictates the row
          height — the list scrolls to fit the height set by sibling cards. */}
      <div className="relative flex-1">
        <div
          role="radiogroup"
          aria-label="Footprint options"
          className="absolute inset-0 flex flex-col gap-1 overflow-y-auto p-2"
          data-testid="component-footprint-variants"
        >
          {sorted.map((variant, index) => {
            const selected = variant.footprintId === selectedFootprintId;
            return (
              <div
                key={variant.footprintId}
                ref={(node) => {
                  rowRefs.current[index] = node;
                }}
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelect(variant.footprintId)}
                onKeyDown={(event) =>
                  handleKeyDown(event, index, variant.footprintId)
                }
                data-testid={`component-footprint-variant-${variant.footprintId}`}
                className={`group grid cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-3 rounded-control border px-2.5 py-2.5 outline-none transition-colors focus-visible:border-selection ${
                  selected
                    ? "border-selection bg-surface-selected"
                    : "border-transparent hover:bg-surface-hover"
                }`}
              >
                <div className="flex h-8 w-11 items-center justify-center overflow-hidden rounded-control border border-border bg-surface-canvas-well">
                  {backendURL ? (
                    <img
                      src={`${backendURL}/api/modules/${moduleId}/footprints/${encodeURIComponent(
                        variant.footprintId,
                      )}/preview.svg?theme=${themeMode}`}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-text-strong">
                    {variant.variantLabel}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-2xs text-text-tertiary">
                    {variant.name}
                  </div>
                </div>
                <div className="text-right font-mono text-2xs text-text-secondary">
                  <div className="whitespace-nowrap">
                    {variant.mountType ?? "—"} · {variant.padCount} pads
                  </div>
                  {variant.isDefault ? (
                    <span className="mt-1 inline-block bg-surface-control px-1.5 text-2xs uppercase tracking-[.06em] text-text-strong">
                      Default
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="border-t border-border px-3 py-2 text-2xs leading-relaxed text-text-tertiary">
        Select an option to preview its footprint &amp; 3D model. The{" "}
        <span className="font-medium text-text-strong">DEFAULT</span> is used
        when you place the part.
      </p>
    </section>
  );
}
