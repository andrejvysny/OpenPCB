import type { ReactElement } from "react";
import { StatusBar, StatusSegment } from "@shared/frontend/ui/status-bar";
import { SeverityDiamond } from "@shared/frontend/ui/severity-diamond";
import {
  PCB_LAYER_COLORS,
  PCB_LAYER_LABELS,
} from "../../../../shared/frontend/canvas/layers";
import type { PcbLayerId } from "../../../../sdks";
import { usePcbCursorStore } from "../pcb/pcb-cursor-store";

const LAYER_COLORS = PCB_LAYER_COLORS as Record<string, string | undefined>;
const LAYER_LABELS = PCB_LAYER_LABELS as Record<string, string | undefined>;

interface DesignerStatusBarProps {
  gridMm: number;
  /** Zoom, in percent. */
  zoom: number;
  selection: string;
  drcCount?: number;
  /** When provided, the DRC segment becomes a button that opens the DRC tab. */
  onDrcClick?: () => void;
  /** Render the X / Y cursor segments (PCB only). Reads `usePcbCursorStore`. */
  showCursor?: boolean;
  /** Active copper layer chip (PCB only). */
  activeLayer?: PcbLayerId | null;
  /** Contextual tool hint; fills the remaining width. */
  hint?: string;
  /** Board view side chip; omitted when unknown. */
  viewSide?: "top" | "bottom" | null;
  /** Trailing unit segment. */
  unit?: string;
}

function formatMm(value: number): string {
  return value.toFixed(3);
}

/**
 * X / Y cursor segment. Subscribes to the cursor store itself so pointer
 * moves re-render only this segment, never the editor shell.
 */
function CursorReadout(): ReactElement {
  const point = usePcbCursorStore((s) => s.point);
  return (
    <StatusSegment>
      <span className="text-text-caps">X</span>
      <span className="text-text-strong">{point ? formatMm(point.xMm) : "—"}</span>
      <span className="text-text-caps">Y</span>
      <span className="text-text-strong">{point ? formatMm(point.yMm) : "—"}</span>
    </StatusSegment>
  );
}

/** 22px editor status bar (design D2 §9). */
export function DesignerStatusBar({
  gridMm,
  zoom,
  selection,
  drcCount,
  onDrcClick,
  showCursor = false,
  activeLayer,
  hint = "",
  viewSide,
  unit = "mm",
}: DesignerStatusBarProps): ReactElement {
  const layerColor = activeLayer ? LAYER_COLORS[activeLayer] : undefined;
  const layerLabel = activeLayer ? (LAYER_LABELS[activeLayer] ?? activeLayer) : null;

  return (
    <StatusBar>
      {showCursor ? <CursorReadout /> : null}
      <StatusSegment>
        <span className="text-text-caps">grid</span>
        <span className="text-text-strong">{gridMm.toFixed(2)} mm</span>
      </StatusSegment>
      <StatusSegment>
        <span className="text-text-caps">zoom</span>
        <span className="text-text-strong">{zoom.toFixed(0)}%</span>
      </StatusSegment>
      {activeLayer ? (
        <StatusSegment>
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 shrink-0 ring-1 ring-black/40"
            style={{ backgroundColor: layerColor }}
          />
          <span className="font-sans text-text-strong">{layerLabel}</span>
          <span className="text-text-disabled">{activeLayer}</span>
        </StatusSegment>
      ) : null}
      <StatusSegment flex sans className="text-text-tertiary">
        {hint}
      </StatusSegment>
      {drcCount !== undefined ? (
        onDrcClick ? (
          <StatusSegment
            onClick={onDrcClick}
            title="Design rule violations"
            aria-label={`${drcCount} DRC`}
          >
            <SeverityDiamond severity={drcCount > 0 ? "error" : "info"} />
            <span
              className={
                drcCount > 0 ? "font-medium text-status-danger" : undefined
              }
            >
              {drcCount}
            </span>
            <span className="text-text-caps">DRC</span>
          </StatusSegment>
        ) : (
          <StatusSegment title="Design rule violations">
            <SeverityDiamond severity={drcCount > 0 ? "error" : "info"} />
            <span
              className={
                drcCount > 0 ? "font-medium text-status-danger" : undefined
              }
            >
              {drcCount}
            </span>
            <span className="text-text-caps">DRC</span>
          </StatusSegment>
        )
      ) : null}
      <StatusSegment sans className="max-w-[240px] truncate">
        {selection}
      </StatusSegment>
      {viewSide ? (
        <StatusSegment>
          <span className="text-text-caps">view</span>
          <span className="text-text-strong">{viewSide}</span>
        </StatusSegment>
      ) : null}
      <StatusSegment>{unit}</StatusSegment>
    </StatusBar>
  );
}
