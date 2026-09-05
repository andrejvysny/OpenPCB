import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { ReactElement } from "react";
import type { PcbViewSide } from "../../../../sdks";

/**
 * Side-mode toggle: `Viewing Top` / `Viewing Bot`. Clicking flips both the
 * X-mirror (handled by PcbScene) and the physical-layer z-order (via
 * `effectiveRenderOrder`).
 */
export function PcbSideModeButton({
  viewSide,
  onToggle,
}: {
  viewSide: PcbViewSide;
  onToggle: () => void;
}): ReactElement {
  const isTop = viewSide === "top";
  const Icon = isTop ? ArrowDownToLine : ArrowUpFromLine;
  const label = isTop ? "Viewing Top" : "Viewing Bot";
  const aria = isTop ? "Switch to bottom view" : "Switch to top view";
  return (
    <button
      type="button"
      onClick={onToggle}
      title={aria}
      aria-label={aria}
      aria-pressed={!isTop}
      data-testid="pcb-flip-view-button"
      className="inline-flex h-[18px] items-center gap-1 rounded-control border border-border-control px-1.5 text-2xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-strong"
    >
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      {label}
    </button>
  );
}
