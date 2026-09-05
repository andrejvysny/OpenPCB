import { Layers } from "lucide-react";
import { useMemo, type ReactElement } from "react";
import type { PcbLayerCount, PcbLayerId, PcbViewSide } from "../../../../sdks";
import {
  PCB_LAYER_COLORS,
  PCB_LAYER_LABELS,
  PCB_LAYER_TREE,
} from "../../../../shared/frontend/canvas/layers";
import { PcbSideModeButton } from "./PcbSideModeButton";

/** The canvas layer tables cover the Tier-1 layers; ids outside them resolve
 *  to `undefined` and fall back to the raw KiCad id. */
const LAYER_COLORS = PCB_LAYER_COLORS as Record<string, string | undefined>;
const LAYER_LABELS = PCB_LAYER_LABELS as Record<string, string | undefined>;

/** Strip order (design D2 §8). In1/In2 only appear on 4-layer boards. */
const STRIP_LAYERS: ReadonlyArray<{
  id: PcbLayerId;
  requiresLayerCount?: 4;
}> = [
  { id: "F.Cu" },
  { id: "In1.Cu", requiresLayerCount: 4 },
  { id: "In2.Cu", requiresLayerCount: 4 },
  { id: "B.Cu" },
  { id: "F.SilkS" },
  { id: "B.SilkS" },
  { id: "F.CrtYd" },
  { id: "Edge.Cuts" },
  { id: "Drill" },
];

/** Mirrors `LayerTreeNode.activatable` — only copper can become active. */
const ACTIVATABLE: ReadonlySet<string> = new Set<string>(
  PCB_LAYER_TREE.flatMap((node) =>
    node.kind === "layer" && node.activatable ? [node.id] : [],
  ),
);

interface PcbLayerTabStripProps {
  /** Focused/active layer — the same value the Layers panel highlights. */
  activeLayer: PcbLayerId | null;
  /** Same handler as the Layers panel rows (copper only actually applies). */
  onSetActiveLayer: (layer: PcbLayerId) => void;
  layerCount?: PcbLayerCount;
  /** Side-mode chip; hidden when the caller does not wire it. */
  viewSide?: PcbViewSide;
  onToggleViewSide?: () => void;
}

/**
 * 22px layer tab strip under the PCB canvas. Copper tabs set the active layer;
 * non-copper tabs are inert labels (they mirror `node.activatable`).
 */
export function PcbLayerTabStrip({
  activeLayer,
  onSetActiveLayer,
  layerCount = 2,
  viewSide,
  onToggleViewSide,
}: PcbLayerTabStripProps): ReactElement {
  const tabs = useMemo(
    () =>
      STRIP_LAYERS.filter((entry) =>
        entry.requiresLayerCount ? layerCount >= entry.requiresLayerCount : true,
      ),
    [layerCount],
  );

  return (
    <div
      role="tablist"
      aria-label="PCB layers"
      className="flex h-[22px] shrink-0 items-stretch overflow-x-auto border-t border-border bg-surface-panel text-2xs"
      style={{ scrollbarWidth: "none" }}
    >
      <span className="flex shrink-0 items-center px-2">
        <Layers
          aria-hidden="true"
          className="h-[11px] w-[11px] text-text-tertiary"
        />
      </span>
      {tabs.map((entry) => {
        const active = entry.id === activeLayer;
        const activatable = ACTIVATABLE.has(entry.id);
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={!activatable}
            title={`${LAYER_LABELS[entry.id] ?? entry.id} (${entry.id})`}
            data-testid={`pcb-layer-tab-${entry.id}`}
            onClick={() => {
              if (activatable) onSetActiveLayer(entry.id);
            }}
            className={`inline-flex shrink-0 items-center gap-1.5 border-r border-border px-2 whitespace-nowrap transition-colors outline-none ${
              active
                ? "bg-surface-control font-medium text-text-strong"
                : activatable
                  ? "text-text-secondary hover:bg-surface-hover hover:text-text-strong"
                  : "cursor-default text-text-tertiary"
            }`}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0 ring-1 ring-black/40"
              style={{ backgroundColor: LAYER_COLORS[entry.id] }}
            />
            {LAYER_LABELS[entry.id] ?? entry.id}
          </button>
        );
      })}
      <span className="flex-1" />
      {viewSide && onToggleViewSide ? (
        <span className="flex shrink-0 items-center px-1.5">
          <PcbSideModeButton viewSide={viewSide} onToggle={onToggleViewSide} />
        </span>
      ) : null}
    </div>
  );
}
