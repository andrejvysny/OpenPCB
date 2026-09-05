import {
  ChevronDown,
  ChevronRight,
  Droplet,
  Eye,
  EyeOff,
  Focus,
  SlidersHorizontal,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
  type ReactElement,
} from "react";
import type {
  PcbCopperLayerId,
  PcbDisplayMode,
  PcbLayerCount,
  PcbLayerId,
  PcbLayerPreset,
} from "../../../../sdks";
import {
  PCB_LAYER_COLORS,
  PCB_LAYER_PRESETS,
  PCB_LAYER_TREE,
  detectLayerPreset,
  type LayerTreeNode,
  type PcbLayerPresetId,
} from "../../../../shared/frontend/canvas/layers";
import { SegmentedControl } from "@shared/frontend/ui/segmented-control";

interface PcbLayersPanelProps {
  activeLayer: PcbLayerId | null;
  /** Layer that must stay visible for route/edit commands, even when no layer is focused. */
  lockedVisibleLayer?: PcbLayerId | null;
  /** Copper layer of the in-progress route, if any — badged "Routing" on its row. */
  routingLayer?: PcbLayerId | null;
  onSetActiveLayer: (layer: PcbLayerId) => void;
  visibleLayers: ReadonlyArray<PcbLayerId>;
  onSetVisibleLayers: (layers: ReadonlyArray<PcbLayerId>) => void;
  /** 2 → hide In1.Cu / In2.Cu nodes. */
  layerCount?: PcbLayerCount;
  displayMode?: PcbDisplayMode;
  onSetDisplayMode?: (mode: PcbDisplayMode) => void;
  copperFillLayers?: ReadonlyArray<PcbCopperLayerId>;
  onToggleCopperFillLayer?: (layer: PcbCopperLayerId) => void;
  /** Delete same-net traces already fully covered by a pour (redundant routing). */
  onCleanupPourTraces?: () => void;
  /** Preset chip handler. Receives the preset id; "custom" should be ignored. */
  onSelectLayerPreset?: (preset: PcbLayerPreset) => void;
  /**
   * Per-layer opacity map. Optional. When provided, each row gains a
   * collapsible chevron that reveals a 0–100% slider for the layer.
   */
  perLayerOpacity?: Partial<Record<PcbLayerId, number>>;
  /** Slider commit handler. */
  onSetLayerOpacity?: (layer: PcbLayerId, opacity: number) => void;
  /**
   * Row solo. When non-null, only this layer + always-on chrome are
   * visible. Alt+click a row to enter/exit. The icon highlights the
   * currently-soloed row.
   */
  soloLayer?: PcbLayerId | null;
  onToggleSoloLayer?: (layer: PcbLayerId, isActivatable: boolean) => void;
}

const DISPLAY_MODES: ReadonlyArray<{
  id: PcbDisplayMode;
  label: string;
}> = [
  { id: "normal", label: "Normal" },
  { id: "dim", label: "Dim" },
  { id: "solo", label: "Solo" },
];

function isCopperLayer(layer: PcbLayerId): layer is PcbCopperLayerId {
  return (
    layer === "F.Cu" ||
    layer === "In1.Cu" ||
    layer === "In2.Cu" ||
    layer === "B.Cu"
  );
}

const ROW_ICON_BUTTON =
  "shrink-0 rounded-control p-0.5 transition-colors [&_svg]:h-3 [&_svg]:w-3";

/**
 * Hybrid layer panel — grouped tree with a KiCad-style display-mode cycle.
 * Group headers ("Top Layers", "Bottom Layers") toggle every child layer at
 * once; per-layer eye icons toggle individuals. Copper layers may be set as
 * the active layer.
 */
export function PcbLayersPanel({
  activeLayer,
  lockedVisibleLayer = null,
  routingLayer = null,
  onSetActiveLayer,
  visibleLayers,
  onSetVisibleLayers,
  layerCount = 2,
  displayMode = "normal",
  onSetDisplayMode,
  copperFillLayers = [],
  onToggleCopperFillLayer,
  onCleanupPourTraces,
  onSelectLayerPreset,
  perLayerOpacity,
  onSetLayerOpacity,
  soloLayer = null,
  onToggleSoloLayer,
}: PcbLayersPanelProps): ReactElement {
  const activePresetId = useMemo(
    () =>
      detectLayerPreset(
        visibleLayers as Parameters<typeof detectLayerPreset>[0],
      ),
    [visibleLayers],
  );
  const visibleSet = useMemo(() => new Set(visibleLayers), [visibleLayers]);
  // Per-row expansion state for the opacity slider. Hidden by default to
  // keep the panel scannable; expand on chevron click.
  const [expandedOpacityRows, setExpandedOpacityRows] = useState<
    ReadonlySet<PcbLayerId>
  >(new Set());
  const toggleOpacityRow = useCallback((id: PcbLayerId) => {
    setExpandedOpacityRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const copperFillSet = useMemo(
    () => new Set(copperFillLayers),
    [copperFillLayers],
  );
  const [topOpen, setTopOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);

  const filteredNodes = useMemo(
    () =>
      PCB_LAYER_TREE.filter(
        (n) =>
          n.kind === "group" ||
          (n.requiresLayerCount ? layerCount >= n.requiresLayerCount : true),
      ),
    [layerCount],
  );

  const setVisibility = useCallback(
    (next: ReadonlySet<PcbLayerId>) => {
      const arr: PcbLayerId[] = [];
      next.forEach((id) => arr.push(id));
      // Always keep the edit/routing layer visible. Layer focus itself can be
      // cleared, but command-target copper must remain renderable.
      if (lockedVisibleLayer && !next.has(lockedVisibleLayer)) {
        arr.push(lockedVisibleLayer);
      }
      onSetVisibleLayers(arr);
    },
    [lockedVisibleLayer, onSetVisibleLayers],
  );

  const toggleLayer = useCallback(
    (id: PcbLayerId) => {
      const next = new Set(visibleSet);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setVisibility(next);
    },
    [setVisibility, visibleSet],
  );

  const toggleGroup = useCallback(
    (children: ReadonlyArray<PcbLayerId>) => {
      // If every child currently visible → hide all; otherwise show all.
      const allVisible = children.every((c) => visibleSet.has(c));
      const next = new Set(visibleSet);
      for (const c of children) {
        if (allVisible) next.delete(c);
        else next.add(c);
      }
      setVisibility(next);
    },
    [setVisibility, visibleSet],
  );

  // Track which sub-layers belong inside expanded groups so we hide them when
  // the group is collapsed (purely visual).
  const TOP_CHILDREN: ReadonlyArray<PcbLayerId> = [
    "F.SilkS",
    "F.Paste",
    "F.Mask",
    "F.Cu",
  ];
  const BOTTOM_CHILDREN: ReadonlyArray<PcbLayerId> = [
    "B.Cu",
    "B.Mask",
    "B.Paste",
    "B.SilkS",
  ];

  const groupOpen: Record<"group:top" | "group:bottom", boolean> = {
    "group:top": topOpen,
    "group:bottom": bottomOpen,
  };

  const isHidden = (node: LayerTreeNode): boolean => {
    if (node.kind === "group") return false;
    if (TOP_CHILDREN.includes(node.id) && !groupOpen["group:top"]) return true;
    if (BOTTOM_CHILDREN.includes(node.id) && !groupOpen["group:bottom"])
      return true;
    return false;
  };

  const handlePresetClick = useCallback(
    (preset: PcbLayerPresetId) => {
      onSelectLayerPreset?.(preset);
    },
    [onSelectLayerPreset],
  );

  return (
    <div className="flex flex-col">
      {onSelectLayerPreset ? (
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
          {PCB_LAYER_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                title={preset.description}
                aria-pressed={active}
                className={`h-[18px] rounded-control border px-1.5 text-2xs transition-colors ${
                  active
                    ? "border-border-control bg-surface-control font-medium text-text-strong"
                    : "border-border-control text-text-secondary hover:bg-surface-hover hover:text-text-strong"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto">
        {filteredNodes.map((node) => {
          if (isHidden(node)) return null;
          if (node.kind === "group") {
            const open = groupOpen[node.id];
            const allVisible = node.children.every((c) => visibleSet.has(c));
            const anyVisible = node.children.some((c) => visibleSet.has(c));
            return (
              <div
                key={node.id}
                className="group flex h-[22px] items-center gap-1.5 px-2 hover:bg-surface-hover"
              >
                <button
                  type="button"
                  onClick={() =>
                    node.id === "group:top"
                      ? setTopOpen((v) => !v)
                      : setBottomOpen((v) => !v)
                  }
                  className={`${ROW_ICON_BUTTON} text-text-tertiary hover:text-text-strong`}
                  title={open ? "Collapse group" : "Expand group"}
                  aria-expanded={open}
                >
                  {open ? <ChevronDown /> : <ChevronRight />}
                </button>
                <span className="flex-1 truncate text-xs font-medium text-text-strong">
                  {node.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGroup(node.children)}
                  className={`${ROW_ICON_BUTTON} text-text-tertiary hover:text-text-strong`}
                  title={allVisible ? "Hide all" : "Show all"}
                >
                  {anyVisible ? <Eye /> : <EyeOff />}
                </button>
              </div>
            );
          }

          const isActive = node.id === activeLayer;
          const isRouting = routingLayer !== null && node.id === routingLayer;
          const isVisible = visibleSet.has(node.id);
          const color = PCB_LAYER_COLORS[node.id];
          const isChild =
            TOP_CHILDREN.includes(node.id) || BOTTOM_CHILDREN.includes(node.id);
          const copperLayer = isCopperLayer(node.id) ? node.id : null;
          const copperFillActive =
            copperLayer !== null && copperFillSet.has(copperLayer);
          const isSoloed = soloLayer === node.id;
          const opacityValue = perLayerOpacity?.[node.id] ?? 1;
          const opacityExpanded = expandedOpacityRows.has(node.id);
          const handleRowClick = (
            event: MouseEvent<HTMLButtonElement>,
          ): void => {
            if (event.altKey && onToggleSoloLayer) {
              event.preventDefault();
              onToggleSoloLayer(node.id, node.activatable);
              return;
            }
            if (node.activatable) onSetActiveLayer(node.id);
          };
          return (
            <div key={node.id}>
              <div
                className={`group relative flex h-[22px] items-center gap-1.5 pr-2 ${
                  isChild ? "pl-6" : "pl-2"
                } ${
                  isActive || isSoloed
                    ? "bg-surface-selected"
                    : "hover:bg-surface-hover"
                }`}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-full w-0.5"
                    style={{ backgroundColor: color }}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={handleRowClick}
                  data-testid={`pcb-layer-row-${node.id}`}
                  className="flex h-full min-w-0 flex-1 items-center gap-1.5 text-left disabled:cursor-default"
                  title={
                    onToggleSoloLayer
                      ? `${
                          node.activatable
                            ? isActive
                              ? `Clear focus: ${node.label}`
                              : `Focus: ${node.label}`
                            : node.label
                        } · Alt+click to solo`
                      : node.activatable
                        ? isActive
                          ? `Clear focus: ${node.label}`
                          : `Focus: ${node.label}`
                        : node.label
                  }
                >
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/40"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`truncate text-xs ${
                      isActive
                        ? "font-medium text-text-strong"
                        : isVisible
                          ? "text-text"
                          : "text-text-disabled"
                    }`}
                  >
                    {node.label}
                  </span>
                  <span className="shrink-0 font-mono text-2xs text-text-disabled">
                    {node.id}
                  </span>
                  {isRouting ? (
                    <span className="ml-auto shrink-0 rounded-control bg-status-success-soft px-1 text-2xs font-medium uppercase tracking-[.04em] text-status-success">
                      Routing
                    </span>
                  ) : null}
                  {isSoloed ? (
                    <span
                      className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-control bg-surface-control px-1 text-2xs font-medium uppercase tracking-[.04em] text-text-strong"
                      title="Soloed (Alt+click to exit)"
                    >
                      <Focus className="h-2.5 w-2.5" />
                      Solo
                    </span>
                  ) : null}
                </button>
                {onSetLayerOpacity ? (
                  <button
                    type="button"
                    onClick={() => toggleOpacityRow(node.id)}
                    title={
                      opacityExpanded
                        ? "Collapse opacity slider"
                        : "Expand opacity slider"
                    }
                    aria-label="Toggle opacity slider"
                    aria-expanded={opacityExpanded}
                    className={`${ROW_ICON_BUTTON} ${
                      opacityExpanded || opacityValue < 1
                        ? "bg-surface-control text-text-strong"
                        : "text-text-tertiary hover:text-text-strong"
                    }`}
                  >
                    <SlidersHorizontal />
                  </button>
                ) : null}
                {copperLayer !== null && onToggleCopperFillLayer ? (
                  <button
                    type="button"
                    onClick={() => onToggleCopperFillLayer(copperLayer)}
                    title={
                      copperFillActive
                        ? "Hide copper fills"
                        : "Show copper fills"
                    }
                    className={`relative ${ROW_ICON_BUTTON} ${
                      copperFillActive
                        ? "bg-surface-control text-text-strong"
                        : "text-text-tertiary hover:text-text-strong"
                    }`}
                  >
                    <Droplet />
                    {!copperFillActive ? (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current"
                      />
                    ) : null}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleLayer(node.id)}
                  disabled={node.id === lockedVisibleLayer}
                  title={isVisible ? "Hide layer" : "Show layer"}
                  className={`${ROW_ICON_BUTTON} text-text-tertiary hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  {isVisible ? <Eye /> : <EyeOff />}
                </button>
              </div>
              {onSetLayerOpacity && opacityExpanded ? (
                <div
                  className={`flex h-[22px] items-center gap-2 pr-2 ${
                    isChild ? "pl-6" : "pl-2"
                  }`}
                >
                  <span className="text-2xs uppercase tracking-[.04em] text-text-caps">
                    Opacity
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={opacityValue}
                    onChange={(e) =>
                      onSetLayerOpacity(node.id, Number(e.target.value))
                    }
                    aria-label={`${node.label} opacity`}
                    className="flex-1 accent-[var(--selection)]"
                  />
                  <span className="w-8 text-right font-mono text-2xs text-text-tertiary">
                    {Math.round(opacityValue * 100)}%
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {onCleanupPourTraces && copperFillLayers.length > 0 ? (
        <div className="border-t border-border px-2 py-1.5">
          <button
            type="button"
            onClick={onCleanupPourTraces}
            title="Delete same-net traces already fully covered by a copper pour"
            className="h-[22px] w-full rounded-control border border-border-control px-2 text-2xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-strong"
          >
            Remove redundant pour traces
          </button>
        </div>
      ) : null}
      {onSetDisplayMode ? (
        <div className="flex h-[24px] items-center gap-2 border-t border-border px-2">
          <span className="text-2xs text-text-tertiary">Inactive layers</span>
          <SegmentedControl
            size="sm"
            className="ml-auto"
            aria-label="Display mode"
            options={DISPLAY_MODES.map((m) => ({
              id: m.id,
              label: m.label,
              title: `Display mode: ${m.label} (Ctrl+H)`,
            }))}
            value={displayMode}
            onChange={onSetDisplayMode}
          />
        </div>
      ) : null}
    </div>
  );
}
