import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { PcbBoardContour, PcbBoardOutline } from "../../../../sdks";
import { Button } from "../../../../shared/frontend/ui/button";
import { chamferCorner, filletCorner } from "./outline-corners";

interface CornerOpModalProps {
  mode: "fillet" | "chamfer";
  contour: PcbBoardContour;
  vIndex: number;
  /** Live-preview outline (null clears it). */
  onPreview: (outline: PcbBoardOutline | null) => void;
  onApply: (outline: PcbBoardOutline) => void;
  onClose: () => void;
}

/**
 * Numeric fillet / chamfer entry with live preview. Recomputes the rounded /
 * beveled contour as the user types and pushes it to the canvas overlay; commit
 * dispatches the outline command. Returns a disabled state (invalid) when the
 * value overruns the corner's edges so the user gets immediate feedback instead
 * of a silent no-op.
 */
export function CornerOpModal({
  mode,
  contour,
  vIndex,
  onPreview,
  onApply,
  onClose,
}: CornerOpModalProps): ReactElement {
  const [text, setText] = useState("3");
  const value = Number.parseFloat(text);

  const result = useMemo(() => {
    if (!Number.isFinite(value) || value <= 0) return null;
    return mode === "fillet"
      ? filletCorner(contour, vIndex, value)
      : chamferCorner(contour, vIndex, value);
  }, [contour, mode, value, vIndex]);

  useEffect(() => {
    onPreview(result);
    return () => onPreview(null);
  }, [onPreview, result]);

  const label = mode === "fillet" ? "Fillet radius" : "Chamfer setback";
  const invalid = Number.isFinite(value) && value > 0 && result === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[300px] rounded-card border border-border bg-surface-raised p-4 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold capitalize text-text-primary">
          {mode} corner
        </h2>
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
          {label}
          <div className="relative">
            <input
              autoFocus
              value={text}
              inputMode="decimal"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && result) {
                  onApply(result);
                  onClose();
                }
                if (e.key === "Escape") onClose();
              }}
              className="h-8 w-full rounded-control border border-border-control bg-surface-input pl-2 pr-8 text-sm text-text-primary outline-none focus:border-accent"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-text-tertiary">
              mm
            </span>
          </div>
        </label>
        {invalid ? (
          <p className="mt-2 text-[11px] text-status-warning">
            Value is too large for this corner.
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!result}
            onClick={() => {
              if (result) {
                onApply(result);
                onClose();
              }
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
